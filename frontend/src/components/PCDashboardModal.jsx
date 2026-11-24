import React, { useState, useMemo } from 'react';

// Helper to determine step-level responsible person based on your workflow rules
// (Falls back to project.owner if not explicitly mapped)
const getStepResponsiblePerson = (stepOrder, projectOwner) => {
    if (stepOrder >= 9 && stepOrder <= 11) return 'Shrinivas';
    if (stepOrder <= 8 || stepOrder >= 12) return 'Dilip';
    return projectOwner || 'Unassigned';
};

export default function PCDashboardModal({ isOpen, onClose, projects = [] }) {
    const [selectedPlant, setSelectedPlant] = useState('All');
    const [selectedPerson, setSelectedPerson] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Extract all delayed steps across all projects
    const delayedItems = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        const rows = [];

        projects.forEach((project) => {
            const plantName =
                project.plant === 'Other'
                    ? project.plant_custom_name || 'Other'
                    : project.plant || 'Not Set';

            // Location detail (uses location/department or plant fallback if separate field isn't set)
            const locationName = project.location || project.category || plantName;

            (project.steps || []).forEach((step) => {
                if (
                    !step.is_completed &&
                    !step.is_na &&
                    step.planned_date &&
                    step.planned_date < todayStr
                ) {
                    const plannedObj = new Date(step.planned_date);
                    plannedObj.setHours(0, 0, 0, 0);
                    const diffTime = today.getTime() - plannedObj.getTime();
                    const daysDelayed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

                    const responsiblePerson = getStepResponsiblePerson(
                        step.step_order,
                        project.owner
                    );

                    rows.push({
                        id: `${project.id}-${step.id}`,
                        projectName: project.name,
                        plant: plantName,
                        location: locationName,
                        stepOrder: step.step_order,
                        delayedStep: `${step.step_order}. ${step.step_name}`,
                        plannedDate: step.planned_date,
                        daysDelayed,
                        responsiblePerson,
                        contactEmail: step.contact_email || null,
                    });
                }
            });
        });

        // Sort by most delayed first for urgent PC follow-up
        return rows.sort((a, b) => b.daysDelayed - a.daysDelayed);
    }, [projects]);

    // Unique filter options
    const uniquePlants = useMemo(
        () => Array.from(new Set(delayedItems.map((item) => item.plant))),
        [delayedItems]
    );

    const uniquePersons = useMemo(
        () => Array.from(new Set(delayedItems.map((item) => item.responsiblePerson))),
        [delayedItems]
    );

    // Apply PC filters
    const filteredRows = useMemo(() => {
        return delayedItems.filter((row) => {
            if (selectedPlant !== 'All' && row.plant !== selectedPlant) return false;
            if (selectedPerson !== 'All' && row.responsiblePerson !== selectedPerson) return false;
            if (
                searchQuery.trim() &&
                !row.projectName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                !row.delayedStep.toLowerCase().includes(searchQuery.toLowerCase())
            ) {
                return false;
            }
            return true;
        });
    }, [delayedItems, selectedPlant, selectedPerson, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-base text-rose-600">
                                ⏱️
                            </span>
                            <h2 className="text-lg font-bold text-slate-800">
                                PC Follow-Up Dashboard — Delayed Steps
                            </h2>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Actionable list of overdue milestones across projects for Process Coordinator follow-up
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Filter & Summary Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-6 py-3.5 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                        <input
                            type="text"
                            placeholder="Search project or step..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-56 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                        />

                        <select
                            value={selectedPlant}
                            onChange={(e) => setSelectedPlant(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                        >
                            <option value="All">All Plants</option>
                            {uniquePlants.map((plant) => (
                                <option key={plant} value={plant}>
                                    {plant}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedPerson}
                            onChange={(e) => setSelectedPerson(e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                        >
                            <option value="All">All Responsible Persons</option>
                            {uniquePersons.map((person) => (
                                <option key={person} value={person}>
                                    {person}
                                </option>
                            ))}
                        </select>

                        {(selectedPlant !== 'All' || selectedPerson !== 'All' || searchQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedPlant('All');
                                    setSelectedPerson('All');
                                    setSearchQuery('');
                                }}
                                className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="rounded-full bg-rose-50 px-3 py-1 font-bold text-rose-700 border border-rose-200">
                            {filteredRows.length} Delayed {filteredRows.length === 1 ? 'Step' : 'Steps'} Pending
                        </span>
                    </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px] divide-y divide-slate-200 text-left">
                                <thead className="bg-[#0AA0D3] text-white">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Project Name
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Plant
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Location
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Delayed Step
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Planned Date
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Days Delayed
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
                                            Responsible Person
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {filteredRows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                                                🎉 No delayed steps found matching the current filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRows.map((row) => (
                                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-4 py-3.5 font-bold text-slate-800">
                                                    {row.projectName}
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-slate-700">
                                                    {row.plant}
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-600">
                                                    {row.location}
                                                </td>
                                                <td className="px-4 py-3.5 font-medium text-slate-800">
                                                    {row.delayedStep}
                                                    {row.contactEmail && (
                                                        <div className="mt-0.5 text-[11px] font-normal text-indigo-600">
                                                            📧 {row.contactEmail}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 font-mono text-slate-600">
                                                    {row.plannedDate}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${row.daysDelayed >= 7
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-800'
                                                            }`}
                                                    >
                                                        {row.daysDelayed} {row.daysDelayed === 1 ? 'day' : 'days'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                                                        👤 {row.responsiblePerson}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}