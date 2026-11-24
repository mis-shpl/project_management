import React, { useState, useEffect } from 'react';
import EditPlannedDateModal from './EditPlannedDateModal';
import { addStepMaterial, markMaterialDone, markStepDone } from '../services/api';

export default function ProjectStepsModal({ project, onClose, onRefresh }) {
  const [editingStep, setEditingStep] = useState(null);
  const [completingItem, setCompletingItem] = useState(null); // Holds either { type: 'step', item: step } or { type: 'material', item: mat }
  const [completionRemark, setCompletionRemark] = useState('');
  const [revisionsModalStep, setRevisionsModalStep] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [materialDraft, setMaterialDraft] = useState({ name: '', start_date: '', date: '' });
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');

  // Sync internal steps with incoming project prop
  const [steps, setSteps] = useState(project?.steps || []);

  useEffect(() => {
    if (project?.steps) {
      setSteps(project.steps);
    }
  }, [project]);

  if (!project) return null;

  // Toggle collapsible material sub-rows
  const toggleExpandStep = (stepId) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  // Handle instant update when a date is edited
  const handleEditSuccess = async () => {
    await onRefresh(); // Reload main app state
    setEditingStep(null);
  };

  const handleAddMaterial = async (e, step) => {
    e.preventDefault();
    if (!materialDraft.name.trim() || !materialDraft.date) return;

    setAddingMaterial(true);
    setMaterialError('');
    try {
      await addStepMaterial(step.id, materialDraft.name.trim(), materialDraft.date, materialDraft.start_date);
      setMaterialDraft({ name: '', start_date: '', date: '' });
      setExpandedSteps((prev) => ({ ...prev, [step.id]: true }));
      await onRefresh();
    } catch (err) {
      setMaterialError(err.message);
    } finally {
      setAddingMaterial(false);
    }
  };

  // Handle Mark as Done for both Steps and Sub-Step Materials
  const handleMarkDoneSubmit = async (e) => {
    e.preventDefault();
    if (!completingItem) return;

    const { type, item } = completingItem;

    try {
      const updatedData =
        type === 'step'
          ? await markStepDone(item.id, completionRemark)
          : await markMaterialDone(item.id, completionRemark);

      // Update state locally for INSTANT UI reflection
      if (type === 'step') {
        setSteps((prevSteps) =>
          prevSteps.map((s) => (s.id === updatedData.id ? { ...s, ...updatedData } : s))
        );
      } else {
        // Material updated: locate parent step and update specific material
        setSteps((prevSteps) =>
          prevSteps.map((s) => {
            if (s.materials && s.materials.some((m) => m.id === updatedData.id)) {
              const updatedMaterials = s.materials.map((m) =>
                m.id === updatedData.id ? updatedData : m
              );

              // Automatically check if all materials are completed
              const allMaterialsDone = updatedMaterials.every((m) => m.is_completed);

              return {
                ...s,
                materials: s.materials.map((m) =>
                  m.id === updatedData.id ? updatedData : m 
                ),
              };
            }
            return s;
          })
        );
      }

      setCompletingItem(null);
      setCompletionRemark('');
      onRefresh(); // Refresh parent cards
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle step deletion
  const handleDeleteStep = async (step) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${step.step_name}"? This action is undoable.`
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/projects/steps/${step.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete step');

      setSteps((prevSteps) => prevSteps.filter((s) => s.id !== step.id));
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{project.name}</h2>
            <p className="text-xs text-slate-500">
              Owner: {project.owner} | Location:{' '}
              {project.plant === 'Other' ? project.plant_custom_name : project.plant}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Steps Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
            <div className="text-sm font-semibold text-indigo-900">Shrinivas: steps 9–11</div>
            <p className="mt-1 text-xs text-indigo-800">
              Provide dates for PO Status (Material), PO Status (Service), and Material Receiving Timeline.
              Use the edit button to schedule steps 9 and 10; add each material and its date under step 11.
            </p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                <th className="pb-3">Step / Sub-Item Name</th>
                <th className="pb-3">Planned Date</th>
                <th className="pb-3">Completion Date</th>
                <th className="pb-3">Revisions</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {steps.map((step) => {
                const revisionCount = step.revisions ? step.revisions.length : 0;
                const hasMaterials = step.materials && step.materials.length > 0;
                const isMaterialTimeline = step.step_name === 'Material Receiving Timeline';
                const isShrinivasStep = step.step_order >= 9 && step.step_order <= 11;
                const isExpanded = Boolean(expandedSteps[step.id]);

                return (
                  <React.Fragment key={step.id}>
                    {/* Parent Step Row */}
                    <tr className={isShrinivasStep && !step.is_na ? 'bg-indigo-50/50' : step.is_na || !step.planned_date ? 'bg-slate-50' : 'hover:bg-slate-50/50'}>
                      <td className={`py-3 font-medium ${step.is_na ? 'text-slate-400' : isShrinivasStep ? 'text-indigo-900' : !step.planned_date ? 'text-slate-400' : 'text-slate-800'}`}>
                        {(hasMaterials || isMaterialTimeline) && (
                          <button
                            onClick={() => toggleExpandStep(step.id)}
                            aria-label={`${isExpanded ? 'Hide' : 'Show'} materials for ${step.step_name}`}
                            className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                          >
                            {isExpanded ? '▼' : '►'}
                          </button>
                        )}
                        <div>{step.step_name}</div>
                        <div className={`mt-1 text-[10px] font-semibold ${isShrinivasStep ? 'text-indigo-700' : 'font-normal text-slate-400'}`}>
                          {isShrinivasStep ? 'Shrinivas · assigned task' : 'Responsible: Dilip / Mangesh'}
                        </div>
                        {step.contact_email && (
                          <div className="mt-1 text-[10px] font-normal text-indigo-600">
                            Contact: {step.contact_email}
                          </div>
                        )}
                        {hasMaterials && (
                          <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                            {step.materials.length} Materials
                          </span>
                        )}
                        {isMaterialTimeline && !hasMaterials && (
                          <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Add material dates
                          </span>
                        )}
                      </td>
                      <td className={`py-3 font-mono ${step.is_na || !step.planned_date ? 'text-slate-400' : 'text-slate-600'}`}>
                        {step.is_na ? (
                          <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">N/A</span>
                        ) : step.planned_date || <span className="font-sans text-[10px]">Not scheduled</span>}
                      </td>
                      <td className="py-3 font-mono">
                        {step.is_na ? (
                          <span className="text-slate-400">N/A</span>
                        ) : step.is_completed ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            ✓ {step.actual_completion_date}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3">
                        {revisionCount > 0 ? (
                          <button
                            onClick={() => setRevisionsModalStep(step)}
                            className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100"
                          >
                            {revisionCount} Rev{revisionCount > 1 ? 's' : ''}
                          </button>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        {!step.is_completed && !step.is_na && (
                          <button
                            onClick={() =>
                              setCompletingItem({ type: 'step', item: step })
                            }
                            className="rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Mark as Done
                          </button>
                        )}

                        <button
                          onClick={() => setEditingStep(step)}
                          title={step.planned_date && !step.is_na ? 'Edit Planned Date' : 'Set Planned Date'}
                          className={`rounded px-2 py-1 text-[10px] font-semibold ${!step.planned_date && !step.is_na ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                        >
                          {step.planned_date && !step.is_na ? '✏️' : 'Set Date'}
                        </button>

                        <button
                          onClick={() => handleDeleteStep(step)}
                          title="Delete Step"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>

                    {isMaterialTimeline && isExpanded && !step.is_na && (
                      <tr className="border-l-2 border-indigo-400 bg-indigo-50/20">
                        <td colSpan={5} className="px-4 py-3">
                          <form onSubmit={(e) => handleAddMaterial(e, step)} className="flex flex-wrap items-end gap-2">
                            <label className="min-w-40 flex-1 text-[10px] font-semibold text-slate-600">
                              Material name
                              <input
                                type="text"
                                required
                                value={materialDraft.name}
                                onChange={(e) => setMaterialDraft((draft) => ({ ...draft, name: e.target.value }))}
                                placeholder="Enter material"
                                className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                              />
                            </label>
                            <label className="text-[10px] font-semibold text-slate-600">
                              Start date
                              <input
                                type="date"
                                value={materialDraft.start_date}
                                onChange={(e) => setMaterialDraft((draft) => ({ ...draft, start_date: e.target.value }))}
                                className="mt-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                              />
                            </label>
                            <label className="text-[10px] font-semibold text-slate-600">
                              Planned date
                              <input
                                type="date"
                                required
                                min={materialDraft.start_date || undefined}
                                value={materialDraft.date}
                                onChange={(e) => setMaterialDraft((draft) => ({ ...draft, date: e.target.value }))}
                                className="mt-1 rounded border border-slate-300 bg-white px-2 py-1.5 text-xs"
                              />
                            </label>
                            <button
                              type="submit"
                              disabled={addingMaterial || !materialDraft.name.trim() || !materialDraft.date}
                              className="rounded bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {addingMaterial ? 'Adding...' : '+ Add Material'}
                            </button>
                          </form>
                          {materialError && (
                            <p role="alert" className="mt-2 text-xs text-rose-600">{materialError}</p>
                          )}
                        </td>
                      </tr>
                    )}

                    {/* Collapsible Child Material Sub-Rows */}
                    {hasMaterials &&
                      isExpanded &&
                      step.materials.map((mat) => (
                        <tr
                          key={mat.id}
                          className="border-l-2 border-indigo-400 bg-indigo-50/20 text-slate-700"
                        >
                          <td className="py-2 pl-8 font-medium">
                            📦 {mat.material_name}
                          </td>
                          <td className="py-2 font-mono text-slate-500">
                            {mat.planned_date}
                          </td>
                          <td className="py-2 font-mono">
                            {mat.is_completed ? (
                              <span className="font-semibold text-emerald-600">
                                ✓ {mat.actual_completion_date}
                              </span>
                            ) : (
                              <span className="text-slate-400">Pending</span>
                            )}
                          </td>
                          <td className="py-2 text-slate-300">—</td>
                          <td className="py-2 text-right">
                            {!mat.is_completed ? (
                              <button
                                onClick={() =>
                                  setCompletingItem({ type: 'material', item: mat })
                                }
                                className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-200"
                              >
                                Mark as Done
                              </button>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-600">
                                Received
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Planned Date Modal */}
      {editingStep && (
        <EditPlannedDateModal
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Unified Mark as Done Modal (Steps & Sub-step Materials) */}
      {completingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-800">
              Mark {completingItem.type === 'step' ? 'Step' : 'Material'} as Done
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {completingItem.type === 'step'
                ? completingItem.item.step_name
                : completingItem.item.material_name}
            </p>

            <form onSubmit={handleMarkDoneSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600">
                  Completion Remark (Optional)
                </label>
                <textarea
                  rows={2}
                  value={completionRemark}
                  onChange={(e) => setCompletionRemark(e.target.value)}
                  placeholder="Add any notes regarding completion..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompletingItem(null)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  Confirm Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Logs Audit Modal */}
      {revisionsModalStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                Revision History
              </h3>
              <button
                onClick={() => setRevisionsModalStep(null)}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
              {revisionsModalStep.revisions.map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between font-mono font-medium text-slate-700">
                    <span>
                      {rev.old_planned_date || 'N/A'} ➔ {rev.new_planned_date}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">
                    <strong>Reason:</strong> {rev.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}