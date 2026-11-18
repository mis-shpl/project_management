import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createProject } from '../services/api';
import { DEFAULT_WORKFLOW_STEPS } from '../constants/steps';

// Predefined Category options to prevent spelling inconsistencies
const CATEGORY_OPTIONS = [
    "Machinery",
    "Infrastructure",
    "Utility",
    "IT/Software",
    "Automation",
    "Expansion",
    "Safety/EHS",
    "Other (type manually)"
];
const OTHER_CATEGORY = "Other (type manually)";


export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
    const [projectDetails, setProjectDetails] = useState({
        name: '',
        project_date: new Date().toISOString().split('T')[0],
        categories: [CATEGORY_OPTIONS[0]],
        category_custom_name: '',
        plant: 'Factory',
        plant_custom_name: '',
        owner: '',
    });

    const [stepDates, setStepDates] = useState(
        DEFAULT_WORKFLOW_STEPS.map((name, index) => ({
            step_name: name,
            step_order: index + 1,
            planned_date: '',
            contact_email: '',
            is_na: false,
            materials: [],
        }))
    );

    const [newMaterial, setNewMaterial] = useState({ name: '', date: '' });
    const [submitError, setSubmitError] = useState('');
    const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
    const [categoryMenuPosition, setCategoryMenuPosition] = useState(null);
    const categoryButtonRef = useRef(null);

    useLayoutEffect(() => {
        if (!isOpen || !isCategoryMenuOpen) return undefined;

        const updateCategoryMenuPosition = () => {
            const button = categoryButtonRef.current;
            if (!button) return;

            const rect = button.getBoundingClientRect();
            const margin = 8;
            const availableBelow = window.innerHeight - rect.bottom - margin;
            const availableAbove = rect.top - margin;
            const openAbove = availableBelow < 320 && availableAbove > availableBelow;
            const availableSpace = openAbove ? availableAbove : availableBelow;
            const height = Math.max(0, Math.min(320, availableSpace - 4));

            setCategoryMenuPosition({
                top: openAbove ? rect.top - height - 4 : rect.bottom + 4,
                left: Math.min(rect.left, window.innerWidth - rect.width - margin),
                width: rect.width,
                height,
            });
        };

        updateCategoryMenuPosition();
        window.addEventListener('resize', updateCategoryMenuPosition);
        document.addEventListener('scroll', updateCategoryMenuPosition, true);

        return () => {
            window.removeEventListener('resize', updateCategoryMenuPosition);
            document.removeEventListener('scroll', updateCategoryMenuPosition, true);
        };
    }, [isOpen, isCategoryMenuOpen]);

    if (!isOpen) return null;

    const effectiveCategory = [
        ...projectDetails.categories.filter((category) => category !== OTHER_CATEGORY),
        ...(projectDetails.categories.includes(OTHER_CATEGORY) && projectDetails.category_custom_name.trim()
            ? [projectDetails.category_custom_name.trim()]
            : []),
    ].join(', ');

    const isDetailsComplete = Boolean(
        projectDetails.name.trim() &&
        projectDetails.project_date &&
        projectDetails.categories.length > 0 &&
        (!projectDetails.categories.includes(OTHER_CATEGORY) || projectDetails.category_custom_name.trim()) &&
        effectiveCategory &&
        projectDetails.owner.trim() &&
        (projectDetails.plant !== 'Other' || projectDetails.plant_custom_name.trim())
    );

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setProjectDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryToggle = (category) => {
        setProjectDetails((prev) => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter((selectedCategory) => selectedCategory !== category)
                : [...prev.categories, category],
        }));
    };

    const handleStepDateChange = (index, value) => {
        const updated = [...stepDates];
        updated[index].planned_date = value;

        for (let i = index + 1; i < updated.length; i++) {
            if (!updated[i].is_na && updated[i].planned_date && updated[i].planned_date < value) {
                updated[i].planned_date = '';
            }
        }
        setStepDates(updated);
    };

    const handleStepNaChange = (index, isNa) => {
        const updated = [...stepDates];
        const step = updated[index];
        if (isNa && step.materials.length > 0) return;

        step.is_na = isNa;
        step.planned_date = '';
        setStepDates(updated);
    };

    const addMaterialItem = (stepIndex) => {
        if (!newMaterial.name.trim() || !newMaterial.date) return;

        const updated = [...stepDates];
        const targetStep = updated[stepIndex];
        targetStep.materials.push({
            material_name: newMaterial.name.trim(),
            planned_date: newMaterial.date,
        });

        // Set step planned_date to the maximum material date
        const maxMaterialDate = targetStep.materials.reduce(
            (max, item) => (item.planned_date > max ? item.planned_date : max),
            ''
        );
        targetStep.planned_date = maxMaterialDate;

        setStepDates(updated);
        setNewMaterial({ name: '', date: '' });
    };

    const removeMaterialItem = (stepIndex, matIndex) => {
        const updated = [...stepDates];
        const targetStep = updated[stepIndex];
        targetStep.materials.splice(matIndex, 1);

        const maxMaterialDate = targetStep.materials.reduce(
            (max, item) => (item.planned_date > max ? item.planned_date : max),
            ''
        );
        targetStep.planned_date = maxMaterialDate;
        setStepDates(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (projectDetails.categories.length === 0) {
            alert('Please select at least one category.');
            return;
        }
        if (
            projectDetails.categories.includes(OTHER_CATEGORY) &&
            !projectDetails.category_custom_name.trim()
        ) {
            alert('Please enter a custom category name.');
            return;
        }

        const payload = {
            name: projectDetails.name.trim(),
            project_date: projectDetails.project_date,
            category: effectiveCategory,
            plant: projectDetails.plant,
            plant_custom_name:
                projectDetails.plant === 'Other' ? projectDetails.plant_custom_name.trim() : null,
            owner: projectDetails.owner.trim(),
            steps: stepDates.map((step) => ({
                ...step,
                planned_date: step.is_na || !step.planned_date ? null : step.planned_date,
                contact_email: step.step_name === 'User Clearance' ? step.contact_email.trim() || null : null,
            })),
        };

        setSubmitError('');
        try {
            await createProject(payload);
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to create project.');
            return;
        }

        onProjectCreated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">Create New Project</h2>
                    <button onClick={onClose} className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {submitError && (
                            <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                                {submitError}
                            </div>
                        )}
                        {/* Form Fields */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Enter Project Details</h3>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600">Project Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={projectDetails.name}
                                    onChange={handleDetailChange}
                                    className="mt-1 w-full rounded-lg border border-slate-400 p-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600">Project Date *</label>
                                    <input
                                        type="date"
                                        name="project_date"
                                        required
                                        value={projectDetails.project_date}
                                        onChange={handleDetailChange}
                                        className="mt-1 w-full rounded-lg border border-slate-400 p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600">Categories *</label>
                                    <div className="relative mt-1">
                                        <button
                                            ref={categoryButtonRef}
                                            type="button"
                                            aria-expanded={isCategoryMenuOpen}
                                            aria-controls="project-category-options"
                                            onClick={() => setIsCategoryMenuOpen((isOpen) => !isOpen)}
                                            className="flex w-full items-center justify-between rounded-lg border border-slate-400 bg-white p-2 text-left text-sm"
                                        >
                                            <span className={projectDetails.categories.length ? 'text-slate-800' : 'text-slate-400'}>
                                                {projectDetails.categories.length
                                                    ? projectDetails.categories.map((category) => (
                                                        category === OTHER_CATEGORY && projectDetails.category_custom_name.trim()
                                                            ? projectDetails.category_custom_name.trim()
                                                            : category
                                                    )).join(', ')
                                                    : 'Select categories'}
                                            </span>
                                            <span aria-hidden="true" className="ml-2 text-slate-500">▾</span>
                                        </button>
                                    </div>
                                    {projectDetails.categories.includes(OTHER_CATEGORY) && (
                                        <input
                                            type="text"
                                            name="category_custom_name"
                                            value={projectDetails.category_custom_name}
                                            onChange={handleDetailChange}
                                            placeholder="Enter category name"
                                            aria-label="Custom category name"
                                            required
                                            className="mt-2 w-full rounded-lg border border-slate-400 p-2 text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600">Plant *</label>
                                    <select
                                        name="plant"
                                        value={projectDetails.plant}
                                        onChange={handleDetailChange}
                                        className="mt-1 w-full rounded-lg border border-slate-400 p-2 text-sm bg-white"
                                    >
                                        <option value="Factory">Factory</option>
                                        <option value="HO">HO</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600">Owner *</label>
                                    <input
                                        type="text"
                                        name="owner"
                                        required
                                        value={projectDetails.owner}
                                        onChange={handleDetailChange}
                                        className="mt-1 w-full rounded-lg border border-slate-400 p-2 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Unlocked Steps */}
                        {isDetailsComplete && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600">2. Steps Schedule</h3>
                                <div className="divide-y divide-slate-100 border rounded-xl border-slate-400 bg-slate-50/50 p-4">
                                    {stepDates.map((step, idx) => {
                                        const previousScheduledStep = stepDates
                                            .slice(0, idx)
                                            .reverse()
                                            .find((previousStep) => !previousStep.is_na && previousStep.planned_date);
                                        const minDate = previousScheduledStep?.planned_date || projectDetails.project_date;
                                        const previousStep = stepDates[idx - 1];
                                        const isStepUnlocked = idx === 0 || previousStep.is_na || previousStep.planned_date;

                                        const isMaterialStep = step.step_name === 'Material Receiving Timeline';
                                        const isUserClearanceStep = step.step_name === 'User Clearance';
                                        const assignee = idx >= 8 && idx <= 10 ? 'Mr. Shrinivas' : 'Mr. Dilip / Mr. Mangesh';

                                        return (
                                            <div key={step.step_name} className={`py-3 ${step.is_na ? 'text-slate-400' : ''}`}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div>
                                                        <span className={`text-xs font-medium ${step.is_na ? 'text-slate-400' : 'text-slate-700'}`}>
                                                            {idx + 1}. {step.step_name}
                                                        </span>
                                                        <span className="ml-2 text-[10px] text-slate-400">{assignee}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium text-slate-500">
                                                            <input
                                                                type="checkbox"
                                                                checked={step.is_na}
                                                                disabled={!isStepUnlocked || (isMaterialStep && step.materials.length > 0)}
                                                                onChange={(e) => handleStepNaChange(idx, e.target.checked)}
                                                                className="rounded border-slate-400"
                                                            />
                                                            N/A
                                                        </label>
                                                        {step.is_na ? (
                                                            <span className="rounded bg-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-500">
                                                                N/A
                                                            </span>
                                                        ) : !isMaterialStep && (
                                                        <input
                                                            type="date"
                                                            min={minDate}
                                                            disabled={!isStepUnlocked}
                                                            value={step.planned_date}
                                                            onChange={(e) => handleStepDateChange(idx, e.target.value)}
                                                            className="rounded-lg border border-slate-400 bg-white px-3 py-1 text-xs text-slate-800 disabled:bg-slate-100"
                                                        />
                                                        )}
                                                    </div>
                                                </div>

                                                {isUserClearanceStep && !step.is_na && (
                                                    <div className="mt-2">
                                                        <label className="block text-[11px] font-medium text-slate-500">
                                                            User Clearance contact email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={step.contact_email}
                                                            onChange={(e) => {
                                                                const updated = [...stepDates];
                                                                updated[idx].contact_email = e.target.value;
                                                                setStepDates(updated);
                                                            }}
                                                            placeholder="user@example.com"
                                                            disabled={!isStepUnlocked}
                                                            className="mt-1 w-full rounded border border-slate-400 px-2 py-1 text-xs disabled:bg-slate-100"
                                                        />
                                                    </div>
                                                )}

                                                {/* Special Material Receiving Nesting */}
                                                {isMaterialStep && !step.is_na && (
                                                    <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3">
                                                        <div className="text-[11px] font-semibold text-indigo-800 mb-2">
                                                            Add Required Materials:
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Material Name"
                                                                value={newMaterial.name}
                                                                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                                                                className="flex-1 rounded border border-slate-400 px-2 py-1 text-xs"
                                                            />
                                                            <input
                                                                type="date"
                                                                min={minDate}
                                                                disabled={!isStepUnlocked}
                                                                value={newMaterial.date}
                                                                onChange={(e) => setNewMaterial({ ...newMaterial, date: e.target.value })}
                                                                className="rounded border border-slate-400 px-2 py-1 text-xs"
                                                            />
                                                            <button
                                                                type="button"
                                                                disabled={!isStepUnlocked}
                                                                onClick={() => addMaterialItem(idx)}
                                                                className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>

                                                        {/* List of Added Materials */}
                                                        {step.materials.length > 0 && (
                                                            <div className="space-y-1.5 border-t border-indigo-100 pt-2">
                                                                {step.materials.map((m, mIdx) => (
                                                                    <div key={mIdx} className="flex items-center justify-between text-xs text-slate-700 bg-white p-1.5 rounded border border-slate-400">
                                                                        <span>📦 {m.material_name}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-slate-500">{m.planned_date}</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeMaterialItem(idx, mIdx)}
                                                                                className="text-rose-500 hover:text-rose-700"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                        >
                            Save Progress
                        </button>
                    </div>
                </form>
            </div>
            {isCategoryMenuOpen && categoryMenuPosition && createPortal(
                <div
                    id="project-category-options"
                    className="flex flex-col overflow-hidden rounded-lg border border-slate-300 bg-white p-2 shadow-lg"
                    style={{
                        position: 'fixed',
                        zIndex: 10000,
                        top: categoryMenuPosition.top,
                        left: categoryMenuPosition.left,
                        width: categoryMenuPosition.width,
                        height: categoryMenuPosition.height,
                    }}
                >
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
                        {CATEGORY_OPTIONS.map((category) => (
                            <label key={category} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={projectDetails.categories.includes(category)}
                                    onChange={() => handleCategoryToggle(category)}
                                    className="rounded border-slate-400"
                                />
                                {category}
                            </label>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsCategoryMenuOpen(false)}
                        className="mt-2 w-full shrink-0 border-t border-slate-100 pt-2 text-right text-xs font-semibold text-indigo-600"
                    >
                        Done
                    </button>
                </div>,
                document.body
            )}
        </div>
    );
}