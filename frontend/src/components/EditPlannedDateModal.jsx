import React, { useState } from 'react';
import { updatePlannedDate } from '../services/api';

function EditPlannedDateModal({ step, onClose, onSuccess }) {
    const [newPlannedDate, setNewPlannedDate] = useState(step.planned_date || '');
    const [contactEmail, setContactEmail] = useState(step.contact_email || '');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isUserClearanceStep = step.step_name === 'User Clearance';
    const hasDateChanged = Boolean(newPlannedDate && newPlannedDate !== (step.planned_date || ''));
    const requiresRevisionReason = hasDateChanged && Boolean(step.planned_date);
    const hasEmailChanged = isUserClearanceStep && contactEmail !== (step.contact_email || '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (requiresRevisionReason && !reason.trim()) {
            setError('A reason for changing the planned date is required.');
            return;
        }
        if (!hasDateChanged && !hasEmailChanged) return;

        setLoading(true);
        setError('');

        try {
            const updates = {};
            if (hasDateChanged) {
                updates.newPlannedDate = newPlannedDate;
                if (requiresRevisionReason) updates.reason = reason.trim();
            }
            if (hasEmailChanged) updates.contactEmail = contactEmail.trim();

            await updatePlannedDate(step.id, updates);

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <h3 className="text-base font-bold text-slate-800">Edit Step Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">Step: {step.step_name}</p>
                {step.is_na && (
                    <div className="mt-3 rounded-lg bg-slate-100 p-2.5 text-xs text-slate-500">
                        <span className="mr-2 rounded bg-slate-200 px-2 py-0.5 font-semibold text-slate-600">N/A</span>
                        This step was marked as not applicable. Choose a date to schedule it.
                    </div>
                )}

                {error && (
                    <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600 font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600">New Planned Date</label>
                        <input
                            type="date"
                            value={newPlannedDate}
                            onChange={(e) => setNewPlannedDate(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
                        />
                    </div>

                    {isUserClearanceStep && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600">
                                User Clearance contact email
                            </label>
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="user@example.com"
                                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
                            />
                        </div>
                    )}

                    {requiresRevisionReason && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600">
                                Reason for Revision <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Explain why this step date is being updated..."
                                className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || (!hasDateChanged && !hasEmailChanged) || (requiresRevisionReason && !reason.trim())}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPlannedDateModal;