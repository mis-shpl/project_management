import React, { useState } from 'react';
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


export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }) {
    const [projectDetails, setProjectDetails] = useState({
        name: '',
        project_date: new Date().toISOString().split('T')[0],
        category: CATEGORY_OPTIONS[0],
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
            materials: [],
        }))
    );

    const [newMaterial, setNewMaterial] = useState({ name: '', date: '' });

    if (!isOpen) return null;

    const effectiveCategory =
        projectDetails.category === 'Other (type manually)'
            ? projectDetails.category_custom_name.trim()
            : projectDetails.category;

    const isDetailsComplete = Boolean(
        projectDetails.name.trim() &&
        projectDetails.project_date &&
        effectiveCategory &&
        projectDetails.owner.trim() &&
        (projectDetails.plant !== 'Other' || projectDetails.plant_custom_name.trim())
    );

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setProjectDetails((prev) => ({ ...prev, [name]: value }));
    };

    const handleStepDateChange = (index, value) => {
        const updated = [...stepDates];
        updated[index].planned_date = value;

        for (let i = index + 1; i < updated.length; i++) {
            if (updated[i].planned_date && updated[i].planned_date < value) {
                updated[i].planned_date = '';
            }
        }
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
        const missingSteps = stepDates.filter((s) => !s.planned_date);
        if (missingSteps.length > 0) {
            alert('Please complete dates for all steps (including materials).');
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
            steps: stepDates,
        };

        await createProject(payload);
        onProjectCreated();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-lg font-bold text-slate-800">Create New Project</h2>
                    <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                                    <label className="block text-xs font-semibold text-slate-600">Category *</label>
                                    <select
                                        name="category"
                                        value={projectDetails.category}
                                        onChange={handleDetailChange}
                                        className="mt-1 w-full rounded-lg border border-slate-400 p-2 text-sm bg-white"
                                    >
                                        {CATEGORY_OPTIONS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
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
                                        const minDate =
                                            idx === 0
                                                ? projectDetails.project_date
                                                : stepDates[idx - 1].planned_date || projectDetails.project_date;

                                        const isMaterialStep = step.step_name === 'Material Receiving Timeline';

                                        return (
                                            <div key={step.step_name} className="py-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="text-xs font-medium text-slate-700">
                                                        {idx + 1}. {step.step_name}
                                                    </span>
                                                    {!isMaterialStep && (
                                                        <input
                                                            type="date"
                                                            min={minDate}
                                                            disabled={idx > 0 && !stepDates[idx - 1].planned_date}
                                                            value={step.planned_date}
                                                            onChange={(e) => handleStepDateChange(idx, e.target.value)}
                                                            className="rounded-lg border border-slate-400 bg-white px-3 py-1 text-xs text-slate-800 disabled:bg-slate-100"
                                                        />
                                                    )}
                                                </div>

                                                {/* Special Material Receiving Nesting */}
                                                {isMaterialStep && (
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
                                                                value={newMaterial.date}
                                                                onChange={(e) => setNewMaterial({ ...newMaterial, date: e.target.value })}
                                                                className="rounded border border-slate-400 px-2 py-1 text-xs"
                                                            />
                                                            <button
                                                                type="button"
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
                            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 border border-indigo-600 hover:bg-slate-100 cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                        >
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}