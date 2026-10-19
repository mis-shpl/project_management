import React from 'react';

export default function ProjectCard({ project, onClick, onDelete }) {
    // Dynamically calculate completed steps based on step.is_completed
    const steps = project.steps || [];
    const totalSteps = steps.length;
    const completedSteps = steps.filter((step) => step.is_completed).length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

    const plantDisplay =
        project.plant === 'Other' ? project.plant_custom_name : project.plant;

    const handleDelete = (e) => {
        e.stopPropagation(); // Prevent opening the steps modal when clicking delete
        const confirmDelete = window.confirm(
            `Are you sure you want to delete the project "${project.name}"? This will delete all associated steps and history.`
        );
        if (confirmDelete) {
            onDelete(project.id);
        }
    };

    return (
        <div
            onClick={onClick}
            className="group relative cursor-pointer rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
        >
            {/* Top badges & delete button */}
            <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    {project.category}
                </span>
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${totalSteps > 0 && progressPercent === 100
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                    >
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${totalSteps > 0 && progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                        />
                        {totalSteps > 0 && progressPercent === 100 ? 'Completed' : 'In Progress'}
                    </span>

                    {/* Temporarily enabled Delete Project Button */}
                    <button
                        onClick={handleDelete}
                        title="Delete Project Card"
                        className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {/* Title */}
            <h3 className="mt-3 text-base font-bold text-slate-800 group-hover:text-indigo-600">
                {project.name}
            </h3>

            {/* Metadata */}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>📍 {plantDisplay}</span>
                <span>👤 {project.owner}</span>
                <span>📅 {project.project_date}</span>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="mt-4 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Milestone Progress</span>
                    <span className="text-slate-700">
                        {completedSteps}/{totalSteps} ({progressPercent}%)
                    </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}