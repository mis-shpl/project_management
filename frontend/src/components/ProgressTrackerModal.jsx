import { useState } from 'react';

export default function ProgressTrackerPanel({ projects = [] }) {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [activeMetric, setActiveMetric] = useState(null);
    const selectedProject = projects.find(
        (project) => String(project.id) === selectedProjectId
    );

    const steps = (selectedProject?.steps || []).filter((step) => !step.is_na);
    const metricSteps = {
        completed: steps.filter((step) => step.is_completed),
        pending: steps.filter((step) => !step.is_completed),
        delayed: steps.filter(
        (step) =>
            step.is_completed &&
            step.planned_date &&
            step.actual_completion_date &&
            step.actual_completion_date > step.planned_date
        ),
    };
    const activeSteps = activeMetric ? metricSteps[activeMetric] : null;
    const metricLabels = {
        completed: 'Completed',
        pending: 'Pending',
        delayed: 'Delayed',
    };

    return (
        <section className="space-y-5" aria-label="Project progress tracker">
            <div className="max-w-md">
                <label
                    htmlFor="progress-tracker-project"
                    className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500"
                >
                    Project
                </label>
                <select
                    id="progress-tracker-project"
                    value={selectedProjectId}
                    onChange={(event) => {
                        setSelectedProjectId(event.target.value);
                        setActiveMetric(null);
                    }}
                    disabled={projects.length === 0}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 disabled:bg-slate-100"
                >
                    <option value="">
                        {projects.length === 0 ? 'No projects available' : 'Select a project'}
                    </option>
                    {projects.map((project) => (
                        <option key={project.id} value={String(project.id)}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedProject ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    Select a project to view its step progress.
                </div>
            ) : (
                <>
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-bold text-slate-800">{selectedProject.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            Delayed steps are included in the completed total. Steps marked N/A are excluded.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <MetricCard
                            label="Completed"
                            count={metricSteps.completed.length}
                            color="emerald"
                            isSelected={activeMetric === 'completed'}
                            onClick={() => setActiveMetric(activeMetric === 'completed' ? null : 'completed')}
                        />
                        <MetricCard
                            label="Pending"
                            count={metricSteps.pending.length}
                            color="amber"
                            isSelected={activeMetric === 'pending'}
                            onClick={() => setActiveMetric(activeMetric === 'pending' ? null : 'pending')}
                        />
                        <MetricCard
                            label="Delayed"
                            count={metricSteps.delayed.length}
                            color="rose"
                            isSelected={activeMetric === 'delayed'}
                            onClick={() => setActiveMetric(activeMetric === 'delayed' ? null : 'delayed')}
                        />
                    </div>

                    {activeMetric && (
                        <div
                            id="progress-step-list"
                            className="rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <h4 className="text-sm font-bold text-slate-800">
                                {metricLabels[activeMetric]} steps
                            </h4>
                            {activeSteps.length > 0 ? (
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    {activeSteps.map((step) => (
                                        <li key={step.id} className="rounded-lg bg-slate-50 px-3 py-2">
                                            {step.step_name}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-3 text-sm text-slate-500">
                                    No {metricLabels[activeMetric].toLowerCase()} steps.
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

function MetricCard({ label, count, color, isSelected, onClick }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700',
        amber: 'bg-amber-50 text-amber-700',
        rose: 'bg-rose-50 text-rose-700',
    };

    return (
        <button
            type="button"
            aria-pressed={isSelected}
            aria-controls="progress-step-list"
            onClick={onClick}
            className={`w-full cursor-pointer rounded-2xl p-5 text-left shadow-sm transition hover:brightness-95 focus:outline-none ${
                colorClasses[color]
            }`}
        >
            <div className="text-3xl font-extrabold">{count}</div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider">{label} steps</div>
        </button>
    );
}