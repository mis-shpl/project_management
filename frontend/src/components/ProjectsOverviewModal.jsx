import React, { useState, useMemo } from 'react';

export default function ProjectsOverviewModal({ isOpen, onClose, projects = [] }) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedPlant, setSelectedPlant] = useState('All');
    const [selectedOwner, setSelectedOwner] = useState('All');

    // Extract unique plants and owners for filter dropdowns
    const uniquePlants = Array.from(
        new Set(projects.map((p) => (p.plant === 'Other' ? p.plant_custom_name : p.plant)).filter(Boolean))
    );
    const uniqueOwners = Array.from(new Set(projects.map((p) => p.owner).filter(Boolean)));

    // Preset Date Handlers
    const applyPreset = (preset) => {
        const now = new Date();
        let start = new Date();

        if (preset === 'week') {
            const day = now.getDay();
            start.setDate(now.getDate() - day);
        } else if (preset === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (preset === 'quarter') {
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            start = new Date(now.getFullYear(), quarterMonth, 1);
        } else if (preset === 'all') {
            setFromDate('');
            setToDate('');
            return;
        }

        setFromDate(start.toISOString().split('T')[0]);
        setToDate(now.toISOString().split('T')[0]);
    };

    const resetFilters = () => {
        setFromDate('');
        setToDate('');
        setSelectedPlant('All');
        setSelectedOwner('All');
    };

    // Filtered Projects
    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const plantName = p.plant === 'Other' ? p.plant_custom_name : p.plant;
            if (selectedPlant !== 'All' && plantName !== selectedPlant) return false;
            if (selectedOwner !== 'All' && p.owner !== selectedOwner) return false;
            if (fromDate && p.project_date < fromDate) return false;
            if (toDate && p.project_date > toDate) return false;
            return true;
        });
    }, [projects, selectedPlant, selectedOwner, fromDate, toDate]);

    if (!isOpen) return null;

    // Calculate Metrics
    const todayStr = new Date().toISOString().split('T')[0];

    let totalProjects = filteredProjects.length;
    let completedProjects = 0;
    let pendingProjects = 0;
    let delayedProjectsCount = 0;
    let totalWorkDonePercentSum = 0;

    const plantCounts = {};

    filteredProjects.forEach((p) => {
        const steps = p.steps || [];
        const totalSteps = steps.length;
        const completedSteps = steps.filter((s) => s.is_completed).length;
        const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
        totalWorkDonePercentSum += progress;

        const isFullyCompleted = totalSteps > 0 && completedSteps === totalSteps;
        if (isFullyCompleted) {
            completedProjects++;
        } else {
            pendingProjects++;
        }

        // Check if any step is delayed (not completed and planned date < today)
        const hasDelayedStep = steps.some((s) => !s.is_completed && s.planned_date < todayStr);
        if (hasDelayedStep) {
            delayedProjectsCount++;
        }

        // Plant distribution
        const plantKey = p.plant === 'Other' ? p.plant_custom_name || 'Other' : p.plant || 'Not Set';
        plantCounts[plantKey] = (plantCounts[plantKey] || 0) + 1;
    });

    const avgWorkDone = totalProjects > 0 ? Math.round(totalWorkDonePercentSum / totalProjects) : 0;

    // Status breakdown numbers
    const onTrackProjects = Math.max(0, pendingProjects - delayedProjectsCount);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-slate-100 shadow-2xl overflow-hidden">

                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        <h2 className="text-lg font-bold text-slate-800">Projects Dashboard</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Filter Bar */}
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm text-xs">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Plant
                            </label>
                            <select
                                value={selectedPlant}
                                onChange={(e) => setSelectedPlant(e.target.value)}
                                className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700 bg-white min-w-[110px]"
                            >
                                <option value="All">All Plants</option>
                                {uniquePlants.map((plant) => (
                                    <option key={plant} value={plant}>
                                        {plant}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Owner
                            </label>
                            <select
                                value={selectedOwner}
                                onChange={(e) => setSelectedOwner(e.target.value)}
                                className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700 bg-white min-w-[110px]"
                            >
                                <option value="All">All Owners</option>
                                {uniqueOwners.map((owner) => (
                                    <option key={owner} value={owner}>
                                        {owner}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 pt-4">
                            <button
                                type="button"
                                onClick={() => applyPreset('week')}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                            >
                                This Week
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('month')}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                            >
                                This Month
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('quarter')}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                            >
                                This Quarter
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset('all')}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
                            >
                                All Time
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-500 hover:bg-slate-50"
                            >
                                ✕ Reset
                            </button>
                        </div>
                    </div>

                    {/* Metric Cards Banner */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {/* Total Projects */}
                        <div className="rounded-2xl bg-sky-500 p-4 text-white shadow-sm">
                            <div className="text-3xl font-extrabold">{totalProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Total Projects
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="rounded-2xl bg-emerald-500 p-4 text-white shadow-sm">
                            <div className="text-3xl font-extrabold">{completedProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Completed
                            </div>
                        </div>

                        {/* Pending / Active */}
                        <div className="rounded-2xl bg-amber-500 p-4 text-white shadow-sm">
                            <div className="text-3xl font-extrabold">{pendingProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Pending / Active
                            </div>
                        </div>

                        {/* With Delayed Step(s) */}
                        <div className="rounded-2xl bg-rose-500 p-4 text-white shadow-sm">
                            <div className="text-3xl font-extrabold">{delayedProjectsCount}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                With Delayed Step(s)
                            </div>
                        </div>

                        {/* Avg. Work Done */}
                        <div className="rounded-2xl bg-indigo-600 p-4 text-white shadow-sm">
                            <div className="text-3xl font-extrabold">{avgWorkDone}%</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Avg. Work Done
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                        {/* Projects by Plant */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800">Projects by Plant</h3>
                            <p className="text-xs text-slate-400">How many projects per plant</p>

                            <div className="mt-6 flex flex-col items-center justify-center">
                                {/* SVG Donut Chart */}
                                <svg viewBox="0 0 36 36" className="h-40 w-40 transform -rotate-90">
                                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#0284c7"
                                        strokeWidth="5"
                                        strokeDasharray="40 60"
                                        strokeDashoffset="0"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#a3e635"
                                        strokeWidth="5"
                                        strokeDasharray="25 75"
                                        strokeDashoffset="-40"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#f59e0b"
                                        strokeWidth="5"
                                        strokeDasharray="35 65"
                                        strokeDashoffset="-65"
                                    />
                                </svg>

                                {/* Legend */}
                                <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-sky-600 rounded-sm"></span> Not Set
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-lime-400 rounded-sm"></span> Factory
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-amber-500 rounded-sm"></span> HO
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800">Status Breakdown</h3>
                            <p className="text-xs text-slate-400">Completed vs On Track vs Delayed</p>

                            <div className="mt-6 flex flex-col items-center justify-center">
                                {/* SVG Donut Chart */}
                                <svg viewBox="0 0 36 36" className="h-40 w-40 transform -rotate-90">
                                    <circle cx="18" cy="18" r="14" fill="transparent" stroke="#f1f5f9" strokeWidth="5" />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#10b981"
                                        strokeWidth="5"
                                        strokeDasharray="30 70"
                                        strokeDashoffset="0"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#0284c7"
                                        strokeWidth="5"
                                        strokeDasharray="35 65"
                                        strokeDashoffset="-30"
                                    />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="14"
                                        fill="transparent"
                                        stroke="#f43f5e"
                                        strokeWidth="5"
                                        strokeDasharray="35 65"
                                        strokeDashoffset="-65"
                                    />
                                </svg>

                                {/* Legend */}
                                <div className="mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-sm"></span> Completed ({completedProjects})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-sky-600 rounded-sm"></span> On Track ({onTrackProjects})
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2.5 w-2.5 bg-rose-500 rounded-sm"></span> Delayed ({delayedProjectsCount})
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Work % by Owner Section */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800">Work % by Owner</h3>
                        <p className="text-xs text-slate-400">Steps completed vs total, per project owner</p>

                        <div className="mt-4 space-y-3">
                            {uniqueOwners.length === 0 ? (
                                <div className="text-xs text-slate-400 italic">No owners found</div>
                            ) : (
                                uniqueOwners.map((owner) => {
                                    const ownerProjects = filteredProjects.filter((p) => p.owner === owner);
                                    let ownerTotalSteps = 0;
                                    let ownerCompletedSteps = 0;

                                    ownerProjects.forEach((p) => {
                                        (p.steps || []).forEach((s) => {
                                            ownerTotalSteps++;
                                            if (s.is_completed) ownerCompletedSteps++;
                                        });
                                    });

                                    const percent =
                                        ownerTotalSteps > 0
                                            ? Math.round((ownerCompletedSteps / ownerTotalSteps) * 100)
                                            : 0;

                                    return (
                                        <div key={owner} className="space-y-1 text-xs">
                                            <div className="flex justify-between font-semibold text-slate-700">
                                                <span>👤 {owner}</span>
                                                <span>
                                                    {ownerCompletedSteps}/{ownerTotalSteps} steps ({percent}%)
                                                </span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full bg-indigo-600 transition-all"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}