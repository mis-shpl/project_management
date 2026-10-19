import React, { useState } from 'react';
import { updatePlannedDate } from '../services/api';

function EditPlannedDateModal({ step, onClose, onSuccess }) {
    const [newPlannedDate, setNewPlannedDate] = useState(step.planned_date);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('A reason for changing the planned date is required.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await updatePlannedDate(step.id, newPlannedDate, reason.trim());

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
                <h3 className="text-base font-bold text-slate-800">Edit Planned Date</h3>
                <p className="text-xs text-slate-500 mt-0.5">Step: {step.step_name}</p>

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
                            required
                            value={newPlannedDate}
                            onChange={(e) => setNewPlannedDate(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-sm"
                        />
                    </div>

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
                            disabled={loading || !reason.trim()}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Update Schedule'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPlannedDateModal;