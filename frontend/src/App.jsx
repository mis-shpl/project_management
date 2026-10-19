import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ProjectCard from './components/ProjectCard';
import CreateProjectModal from './components/CreateProjectModal';
import ProjectStepsModal from './components/ProjectStepModal';
import ProjectsOverviewModal from './components/ProjectsOverviewModal';
import { fetchProjects, deleteProject } from './services/api';

export default function App() {
    const [projects, setProjects] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [viewMode, setViewMode] = useState('cards');
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

    const handleDeleteProject = async (projectId) => {
        try {
            await deleteProject(projectId);
            loadProjects();
        } catch (err) {
            alert(err.message);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const activeProject = projects.find((p) => p.id === selectedProject?.id) || selectedProject;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased">
            <Navbar
                onOpenModal={() => setIsModalOpen(true)}
                onOpenDashboard={() => setIsDashboardOpen(true)}
            />

            <main className="mx-auto max-w-7xl px-6 py-8">
                {loading ? (
                    <div className="flex justify-center py-12 text-sm text-slate-500">
                        Loading project data...
                    </div>
                ) : projects.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <h3 className="text-base font-semibold text-slate-700">No projects created yet</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Click "+ New Project" to register your first project.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 cursor-pointer"
                        >
                            + Create Project
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onClick={() => setSelectedProject(project)}
                                onDelete={handleDeleteProject}
                            />
                        ))}
                    </div>
                )}
            </main>
            {/* Modal for Creating Project */}
            <CreateProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onProjectCreated={loadProjects}
            />

            {selectedProject && (
                <ProjectStepsModal
                    project={activeProject}
                    onClose={() => setSelectedProject(null)}
                    onRefresh={loadProjects}
                />
            )}

            <ProjectsOverviewModal
                isOpen={isDashboardOpen}
                onClose={() => setIsDashboardOpen(false)}
                projects={projects}
            />
        </div>
    );
}