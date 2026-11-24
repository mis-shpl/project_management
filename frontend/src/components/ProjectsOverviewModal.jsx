import React, { useState, useMemo } from 'react';
import ProgressTrackerPanel from './ProgressTrackerModal';

function getMetricLabel(metric) {
    const labels = {
        total: 'Total Projects',
        completed: 'Completed Projects',
        pending: 'Pending / Active Projects',
        delayed: 'Projects With Delayed Steps',
        average: 'Projects by Work Done',
    };
    return labels[metric];
}

function getCurrentPendingStep(project) {
    const orderedSteps = [...(project.steps || [])].sort((a, b) => a.step_order - b.step_order);
    const lastCompletedIndex = orderedSteps.reduce(
        (lastIndex, step, index) => (step.is_completed ? index : lastIndex),
        -1
    );

    return (
        orderedSteps
            .slice(lastCompletedIndex + 1)
            .find((step) => !step.is_completed && !step.is_na) || null
    );
}

function toDateNumber(value) {
    if (!value) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function GanttPanel({ projects = [] }) {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [scale, setScale] = useState('day');
    const [materialsExpanded, setMaterialsExpanded] = useState(true);

    const selectedProject = projects.find((project) => String(project.id) === String(selectedProjectId))
        || projects[0]
        || null;

    const projectStart = selectedProject?.project_date || '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const items = (selectedProject?.steps || []).filter((step) => !step.is_na);
    const materials = items.flatMap((step) =>
        (step.materials || []).map((material) => ({ ...material, stepName: step.step_name }))
    );
    const dates = [
        toDateNumber(projectStart),
        ...items.flatMap((step) => [toDateNumber(step.start_date), toDateNumber(step.planned_date)]),
        ...materials.flatMap((material) => [toDateNumber(material.start_date), toDateNumber(material.planned_date)]),
    ].filter((value) => value !== null);

    const startMs = dates.length ? Math.min(...dates) : today.getTime();
    const endMs = dates.length ? Math.max(...dates, today.getTime()) : today.getTime();
    const startDate = new Date(startMs);
    const endDate = new Date(Math.max(endMs, startMs));
    startDate.setHours(0, 0, 0, 0);
    endDate.setDate(endDate.getDate() + 14);

    const dayMs = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / dayMs));
    const pixelsPerDay = scale === 'day' ? 24 : 14;
    const timelineWidth = totalDays * pixelsPerDay;
    const offsetForDate = (value, fallback = projectStart) => {
        const ms = toDateNumber(value) || toDateNumber(fallback);
        if (ms === null) return 0;
        return Math.max(0, Math.min(timelineWidth, ((ms - startDate.getTime()) / dayMs) * pixelsPerDay));
    };
    const todayOffset = offsetForDate(todayStr);

    const getBarStyle = (item, isMaterial = false) => {
        const start = item.start_date || (!isMaterial ? projectStart : projectStart);
        const planned = item.planned_date;
        const startOffset = offsetForDate(start);
        const endOffset = planned ? offsetForDate(planned) : startOffset + pixelsPerDay;
        const width = Math.max(pixelsPerDay, endOffset - startOffset);
        let color = 'bg-slate-400';

        if (item.is_completed) {
            color = item.actual_completion_date && planned && item.actual_completion_date > planned
                ? 'bg-rose-500'
                : 'bg-emerald-500';
        } else if (planned && planned < todayStr) {
            color = 'bg-rose-500';
        } else if (start && start <= todayStr && (!planned || planned >= todayStr)) {
            color = 'bg-amber-500';
        }

        return { left: startOffset, width, color };
    };

    const headerItems = [];
    if (scale === 'day') {
        for (let i = 0; i < totalDays; i += 1) {
            const date = new Date(startDate.getTime() + i * dayMs);
            headerItems.push(date);
        }
    } else {
        for (let i = 0; i < totalDays; i += 7) {
            headerItems.push(new Date(startDate.getTime() + i * dayMs));
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Project</label>
                    <select
                        value={selectedProject?.id || ''}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="mt-1 min-w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
                    >
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex rounded-lg border border-slate-200 p-1">
                    {['day', 'week'].map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setScale(option)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                                scale === option ? 'bg-indigo-600 text-white' : 'text-slate-500'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {!selectedProject ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                    No projects available.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <div style={{ minWidth: 260 + timelineWidth }}>
                            <div className="flex border-b border-slate-200">
                                <div className="sticky left-0 z-30 w-[260px] shrink-0 border-r border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
                                    Timeline
                                </div>
                                <div className="relative h-12 shrink-0" style={{ width: timelineWidth }}>
                                    <div
                                        className="absolute top-0 z-10 h-full border-l-2 border-dashed border-rose-400"
                                        style={{ left: todayOffset }}
                                    />
                                    {headerItems.map((date, index) => {
                                        const left = index * (scale === 'day' ? pixelsPerDay : 7 * pixelsPerDay);
                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className="absolute top-0 h-full border-l border-slate-200 px-1 pt-3 text-[10px] text-slate-500"
                                                style={{ left, width: scale === 'day' ? pixelsPerDay : 7 * pixelsPerDay }}
                                            >
                                                {scale === 'day'
                                                    ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : `Wk ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {items.map((step) => {
                                const bar = getBarStyle(step);
                                return (
                                    <div key={step.id} className="relative flex border-b border-slate-100">
                                        <div className="sticky left-0 z-20 w-[260px] shrink-0 border-r border-slate-200 bg-white px-4 py-3">
                                            <div className="truncate text-xs font-semibold text-slate-700">{step.step_name}</div>
                                            <div className="mt-1 text-[10px] text-slate-400">
                                                {step.start_date || 'Unassigned'} → {step.planned_date || 'No end'}
                                            </div>
                                        </div>
                                        <div className="relative h-14 shrink-0" style={{ width: timelineWidth }}>
                                            <div className="absolute top-0 z-10 h-full border-l-2 border-dashed border-rose-400" style={{ left: todayOffset }} />
                                            <div
                                                className={`absolute top-4 h-6 rounded-md ${bar.color} shadow-sm`}
                                                style={{ left: bar.left, width: bar.width }}
                                                title={`${step.step_name}: ${step.start_date || projectStart} to ${step.planned_date || 'not scheduled'}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })}

                            {materials.length > 0 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setMaterialsExpanded((expanded) => !expanded)}
                                        className="flex w-full items-center gap-2 border-b border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700"
                                    >
                                        <span>{materialsExpanded ? '▾' : '▸'}</span>
                                        Material Receiving Timeline
                                    </button>
                                    {materialsExpanded && materials.map((material) => {
                                        const bar = getBarStyle(material, true);
                                        return (
                                            <div key={material.id} className="relative flex border-b border-slate-100">
                                                <div className="sticky left-0 z-20 w-[260px] shrink-0 border-r border-slate-200 bg-slate-50 px-7 py-3">
                                                    <div className="truncate text-xs font-medium text-slate-700">{material.material_name}</div>
                                                    <div className="mt-1 text-[10px] text-slate-400">
                                                        {material.start_date || 'Unassigned'} → {material.planned_date || 'No end'}
                                                    </div>
                                                </div>
                                                <div className="relative h-12 shrink-0" style={{ width: timelineWidth }}>
                                                    <div className="absolute top-0 z-10 h-full border-l-2 border-dashed border-rose-400" style={{ left: todayOffset }} />
                                                    <div
                                                        className={`absolute top-3 h-5 rounded-md ${bar.color} shadow-sm`}
                                                        style={{ left: bar.left, width: bar.width }}
                                                        title={`${material.material_name}: ${material.start_date || projectStart} to ${material.planned_date || 'not scheduled'}`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="pointer-events-none absolute z-40 hidden" />
                </div>
            )}
        </div>
    );
}

export default function ProjectsOverviewModal({ isOpen, onClose, projects = [] }) {
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedPlant, setSelectedPlant] = useState('All');
    const [selectedOwner, setSelectedOwner] = useState('All');
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedOverviewMetric, setSelectedOverviewMetric] = useState(null);

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

    const projectMetrics = filteredProjects.map((project) => {
        const steps = project.steps || [];
        const totalSteps = steps.length;
        const completedSteps = steps.filter((step) => step.is_completed || step.is_na).length;

        return {
            project,
            progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
            isFullyCompleted: totalSteps > 0 && completedSteps === totalSteps,
            hasDelayedStep: steps.some(
                (step) =>
                    !step.is_na &&
                    !step.is_completed &&
                    step.planned_date &&
                    step.planned_date < todayStr
            ),
        };
    });

    const totalProjects = projectMetrics.length;
    const completedProjects = projectMetrics.filter((metric) => metric.isFullyCompleted).length;
    const pendingProjects = totalProjects - completedProjects;
    const delayedProjectsCount = projectMetrics.filter((metric) => metric.hasDelayedStep).length;
    const totalWorkDonePercentSum = projectMetrics.reduce((sum, metric) => sum + metric.progress, 0);
    const avgWorkDone = totalProjects > 0 ? Math.round(totalWorkDonePercentSum / totalProjects) : 0;
    const selectedMetricProjects = projectMetrics
        .filter((metric) => {
            if (selectedOverviewMetric === 'completed') return metric.isFullyCompleted;
            if (selectedOverviewMetric === 'pending') return !metric.isFullyCompleted;
            if (selectedOverviewMetric === 'delayed') return metric.hasDelayedStep;
            return true;
        })
        .map((metric) => metric.project);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-slate-100 shadow-2xl overflow-hidden">

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
                    <div className="flex gap-2 border-b border-slate-200" role="tablist" aria-label="Project dashboard views">
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'overview'}
                            onClick={() => setActiveTab('overview')}
                            className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'border-indigo-600 text-indigo-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'progress'}
                            onClick={() => setActiveTab('progress')}
                            className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${
                                activeTab === 'progress'
                                    ? 'border-indigo-600 text-indigo-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Project-wise Tracker
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === 'gantt'}
                            onClick={() => setActiveTab('gantt')}
                            className={`border-b-2 px-4 py-2 text-sm font-semibold cursor-pointer ${
                                activeTab === 'gantt'
                                    ? 'border-indigo-600 text-indigo-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            Project Timeline
                        </button>
                    </div>

                    {activeTab === 'overview' ? (
                    <>
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
                                Location
                            </label>
                            <select
                                value={selectedPlant}
                                onChange={(e) => setSelectedPlant(e.target.value)}
                                className="rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700 bg-white min-w-[110px]"
                            >
                                <option value="All">All Locations</option>
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
                        <button
                            type="button"
                            aria-pressed={selectedOverviewMetric === 'total'}
                            onClick={() => setSelectedOverviewMetric((selected) => selected === 'total' ? null : 'total')}
                            className="cursor-pointer rounded-2xl bg-sky-500 p-4 text-left text-white shadow-sm hover:brightness-95 focus:outline-none"
                        >
                            <div className="text-3xl font-extrabold">{totalProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Total Projects
                            </div>
                        </button>

                        {/* Completed */}
                        <button
                            type="button"
                            aria-pressed={selectedOverviewMetric === 'completed'}
                            onClick={() => setSelectedOverviewMetric((selected) => selected === 'completed' ? null : 'completed')}
                            className="cursor-pointer rounded-2xl bg-emerald-500 p-4 text-left text-white shadow-sm hover:brightness-95 focus:outline-none"
                        >
                            <div className="text-3xl font-extrabold">{completedProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Completed
                            </div>
                        </button>

                        {/* Pending / Active */}
                        <button
                            type="button"
                            aria-pressed={selectedOverviewMetric === 'pending'}
                            onClick={() => setSelectedOverviewMetric((selected) => selected === 'pending' ? null : 'pending')}
                            className="cursor-pointer rounded-2xl bg-amber-500 p-4 text-left text-white shadow-sm hover:brightness-95 focus:outline-none"
                        >
                            <div className="text-3xl font-extrabold">{pendingProjects}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Pending / Active
                            </div>
                        </button>

                        {/* With Delayed Step(s) */}
                        <button
                            type="button"
                            aria-pressed={selectedOverviewMetric === 'delayed'}
                            onClick={() => setSelectedOverviewMetric((selected) => selected === 'delayed' ? null : 'delayed')}
                            className="cursor-pointer rounded-2xl bg-rose-500 p-4 text-left text-white shadow-sm hover:brightness-95 focus:outline-none"
                        >
                            <div className="text-3xl font-extrabold">{delayedProjectsCount}</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                With Delayed Step(s)
                            </div>
                        </button>

                        {/* Avg. Work Done */}
                        <button
                            type="button"
                            aria-pressed={selectedOverviewMetric === 'average'}
                            onClick={() => setSelectedOverviewMetric((selected) => selected === 'average' ? null : 'average')}
                            className="cursor-pointer rounded-2xl bg-indigo-600 p-4 text-left text-white shadow-sm hover:brightness-95 focus:outline-none"
                        >
                            <div className="text-3xl font-extrabold">{avgWorkDone}%</div>
                            <div className="mt-1 text-[11px] font-bold uppercase tracking-wider opacity-90">
                                Avg. Work Done
                            </div>
                        </button>
                    </div>

                    {/* Project Details Table */}
                    {selectedOverviewMetric ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                                <h3 className="text-sm font-bold text-slate-800">
                                    {getMetricLabel(selectedOverviewMetric)}
                                </h3>
                                <span className="text-xs text-slate-500">
                                    {selectedMetricProjects.length} projects
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500">
                                            <th className="px-4 py-3">Project Name</th>
                                            <th className="px-4 py-3">Location</th>
                                            <th className="px-4 py-3">Created At</th>
                                            <th className="px-4 py-3">Current Pending Step / Planned Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {selectedMetricProjects.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                                                    No projects match this metric.
                                                </td>
                                            </tr>
                                        ) : (
                                            selectedMetricProjects.map((project) => {
                                                const pendingStep = getCurrentPendingStep(project);
                                                const plantName =
                                                    project.plant === 'Other'
                                                        ? project.plant_custom_name || 'Other'
                                                        : project.plant || '—';

                                                return (
                                                    <tr key={project.id} className="hover:bg-slate-50">
                                                        <td className="px-4 py-3 font-semibold text-slate-800">
                                                            {project.name}
                                                        </td>
                                                        <td className="px-4 py-3">{plantName}</td>
                                                        <td className="px-4 py-3">
                                                            {project.created_at
                                                                ? new Date(project.created_at).toLocaleString()
                                                                : '—'}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {pendingStep ? (
                                                                <>
                                                                    <div className="font-medium text-slate-800">
                                                                        {pendingStep.step_name}
                                                                    </div>
                                                                    <div className="mt-1 text-slate-500">
                                                                        Planned: {pendingStep.planned_date || 'Not scheduled'}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400">No pending step</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                            Click an overview metric card to view its projects.
                        </div>
                    )}

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
                                            if (s.is_completed || s.is_na) ownerCompletedSteps++;
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

                    </>
                    ) : activeTab === 'progress' ? (
                        <ProgressTrackerPanel projects={projects} />
                    ) : (
                        <GanttPanel projects={projects} />
                    )}
                </div>
            </div>
        </div>
    );
}