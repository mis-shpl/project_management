export default function ProjectCard({ project, serialNumber, onClick, onDelete }) {
    // Dynamically calculate completed steps based on step.is_completed
    const steps = project.steps || [];
    const totalSteps = steps.length;
    const completedSteps = steps.filter((step) => step.is_completed || step.is_na).length;
    const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const today = new Date().toISOString().split('T')[0];
    const isCompleted = totalSteps > 0 && progressPercent === 100;
    const isDelayed =
        !isCompleted &&
        steps.some(
            (step) =>
                !step.is_na &&
                !step.is_completed &&
                step.planned_date &&
                step.planned_date < today
        );
    const status = isCompleted ? 'Completed' : isDelayed ? 'Delayed' : 'In Progress';
    const statusColor = isCompleted
        ? 'bg-emerald-50 text-emerald-700'
        : isDelayed
            ? 'bg-rose-50 text-rose-700'
            : 'bg-indigo-50 text-[#0882ac]';
    const statusDotColor = isCompleted
        ? 'bg-emerald-500'
        : isDelayed
            ? 'bg-rose-500'
            : 'bg-[#0882ac]';

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
        <tr
            onClick={onClick}
            className="group cursor-pointer transition-colors hover:bg-indigo-50/40"
        >
            <td className="px-4 py-4 text-sm font-medium tabular-nums text-slate-500">
                {serialNumber}
            </td>
            <td className="truncate px-4 py-4 text-sm font-semibold text-slate-800 group-hover:text-[#0882ac]">
                {project.name}
            </td>
            <td className="px-4 py-4">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-[#0882ac] ring-1 ring-inset ring-indigo-700/10">
                    {project.category}
                </span>
            </td>
            <td className="truncate px-4 py-4 text-sm text-slate-600">{plantDisplay}</td>
            <td className="truncate px-4 py-4 text-sm text-slate-600">{project.owner}</td>
            <td className="whitespace-nowrap px-4 py-4 text-sm tabular-nums text-slate-600">
                {project.project_date}
            </td>
            <td className="px-4 py-4">
                <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-slate-700">
                    {completedSteps}/{totalSteps} ({progressPercent}%)
                </span>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                        className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-[#0882ac]'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </td>
            <td className="px-4 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor}`} />
                    {status}
                </span>
            </td>
        </tr>
    );
}