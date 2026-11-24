import { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectStepsModal from './components/ProjectStepModal';
import ProjectsOverviewModal from './components/ProjectsOverviewModal';
import PCDashboardModal from './components/PCDashboardModal';
import { useUserAccess } from './hooks/useUserAccess';
import { fetchProjects, deleteProject } from './services/api';

export default function App() {
    const { isAuthorized, email, permissions } = useUserAccess();
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isPCDashboardOpen, setIsPCDashboardOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedHomeMetric, setSelectedHomeMetric] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await fetchProjects();
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Single effect: fetch projects only if user is authorized
    useEffect(() => {
        if (isAuthorized) {
            loadProjects();
        }
    }, [isAuthorized]);

    // Declared BEFORE any early return to obey React's Rules of Hooks
    const homeMetrics = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const metrics = projects.map((project) => {
            const steps = project.steps || [];
            const completedSteps = steps.filter((step) => step.is_completed || step.is_na).length;
            const totalSteps = steps.length;

            return {
                project,
                progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
                isCompleted: totalSteps > 0 && completedSteps === totalSteps,
                isDelayed: steps.some(
                    (step) =>
                        !step.is_na &&
                        !step.is_completed &&
                        step.planned_date &&
                        step.planned_date < today
                ),
            };
        });
        const count = metrics.length;

        return {
            total: count,
            completed: metrics.filter((metric) => metric.isCompleted).length,
            pending: metrics.filter((metric) => !metric.isCompleted).length,
            delayed: metrics.filter((metric) => metric.isDelayed).length,
            average: count
                ? Math.round(metrics.reduce((sum, metric) => sum + metric.progress, 0) / count)
                : 0,
            projects: metrics
                .filter((metric) => {
                    if (selectedHomeMetric === 'completed') return metric.isCompleted;
                    if (selectedHomeMetric === 'pending') return !metric.isCompleted;
                    if (selectedHomeMetric === 'delayed') return metric.isDelayed;
                    return true;
                })
                .map((metric) => metric.project),
        };
    }, [projects, selectedHomeMetric]);

    // Safe to return early now that all hooks are declared
    if (!isAuthorized) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-xl text-rose-600">
                        🚫
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Unauthorized Access</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {email
                            ? `The email address "${email}" is not authorized to access this application.`
                            : 'No user email was provided. Please launch this tool from the Task Manager application.'}
                    </p>
                </div>
            </div>
        );
    }

    const handleDeleteProject = async (projectId) => {
        try {
            await deleteProject(projectId);
            loadProjects();
        } catch (err) {
            alert(err.message);
        }
    };

    const activeProject = projects.find((p) => p.id === selectedProject?.id) || selectedProject;

    const homeMetricCards = [
        {
            id: 'total',
            label: 'Total Projects',
            value: homeMetrics.total,
            textColor: 'text-sky-500',
            backgroundColor: 'bg-white',
            borderColor: 'border-sky-500',
        },
        {
            id: 'completed',
            label: 'Completed',
            value: homeMetrics.completed,
            textColor: 'text-emerald-500',
            backgroundColor: 'bg-white',
            borderColor: 'border-emerald-500',
        },
        {
            id: 'pending',
            label: 'Pending / Active',
            value: homeMetrics.pending,
            textColor: 'text-amber-500',
            backgroundColor: 'bg-white',
            borderColor: 'border-amber-500',
        },
        {
            id: 'delayed',
            label: 'With Delayed Step(s)',
            value: homeMetrics.delayed,
            textColor: 'text-rose-500',
            backgroundColor: 'bg-white',
            borderColor: 'border-rose-500',
        },
        {
            id: 'average',
            label: 'Avg. Work Done',
            value: `${homeMetrics.average}%`,
            textColor: 'text-indigo-600',
            backgroundColor: 'bg-white',
            borderColor: 'border-indigo-600',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
            <Navbar
                permissions={permissions}
                onOpenModal={() => setIsModalOpen(true)}
                onOpenDashboard={() => setIsDashboardOpen(true)}
                onOpenPCDashboard={() => setIsPCDashboardOpen(true)}
            />

            <main className="mx-auto max-w-8xl px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-12 text-sm text-slate-500">
                        Loading project data...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <h3 className="text-base font-semibold text-slate-700">No projects created yet</h3>
                        {permissions.canViewCreateProject && (
                            <>
                                <p className="mt-1 text-xs text-slate-500">
                                    Click "+ Create Project" to register your first project.
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                                >
                                    + Create Project
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        <section aria-label="Project overview metrics">
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                                    Executive Overview
                                </h2>
                                {selectedHomeMetric && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedHomeMetric(null)}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                                    >
                                        Clear filter
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {homeMetricCards.map((metric) => (
                                    <button
                                        key={metric.id}
                                        type="button"
                                        aria-pressed={selectedHomeMetric === metric.id}
                                        onClick={() =>
                                            setSelectedHomeMetric((selected) =>
                                                selected === metric.id ? null : metric.id
                                            )
                                        }
                                        className={`rounded-xl p-4 text-left border-l-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer ${selectedHomeMetric === metric.id
                                                ? 'bg-[#0882ac] text-white border-[#0882AC]'
                                                : `${metric.backgroundColor} ${metric.textColor} ${metric.borderColor}`
                                            }`}
                                    >
                                        <div className="text-3xl font-extrabold tabular-nums">
                                            {metric.value}
                                        </div>
                                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                            {metric.label}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px] table-fixed divide-y divide-slate-200 text-left">
                                    <thead className="bg-[#0aa0d3]">
                                        <tr>
                                            <th scope="col" className="w-16 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Sr. No.
                                            </th>
                                            <th scope="col" className="w-64 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Project
                                            </th>
                                            <th scope="col" className="w-36 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Department
                                            </th>
                                            <th scope="col" className="w-32 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Location
                                            </th>
                                            <th scope="col" className="w-40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Owner
                                            </th>
                                            <th scope="col" className="w-32 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Project Date
                                            </th>
                                            <th scope="col" className="w-56 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Milestone Progress
                                            </th>
                                            <th scope="col" className="w-36 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {homeMetrics.projects.map((project, index) => (
                                            <ProjectCard
                                                key={project.id}
                                                project={project}
                                                serialNumber={index + 1}
                                                onClick={() => setSelectedProject(project)}
                                                onDelete={handleDeleteProject}
                                            />
                                        ))}
                                        {homeMetrics.projects.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                                                    No projects match this metric.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* PROJECT_MANAGERS and ADMINs Only: Create Project Modal */}
            {permissions.canViewCreateProject && (
                <CreateProjectModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onProjectCreated={loadProjects}
                />
            )}

            {selectedProject && (
                <ProjectStepsModal
                    project={activeProject}
                    onClose={() => setSelectedProject(null)}
                    onRefresh={loadProjects}
                />
            )}

            {/* Group 1 Only: Projects Overview Dashboard Modal */}
            {permissions.canViewDashboard && (
                <ProjectsOverviewModal
                    isOpen={isDashboardOpen}
                    onClose={() => setIsDashboardOpen(false)}
                    projects={projects}
                />
            )}

            {/* Group 2 Only: PC Dashboard Modal/View */}
            {permissions.canViewPCDashboard && isPCDashboardOpen && (
                <PCDashboardModal 
                    isOpen={isPCDashboardOpen}
                    onClose={() => setIsPCDashboardOpen(false)}
                    projects={projects}
                />
            )}
        </div>
    );
}