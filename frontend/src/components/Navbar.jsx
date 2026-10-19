import React from 'react';

export default function Navbar({ onOpenModal, onOpenDashboard }) {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                        Project Management Center
                    </h1>
                    <p className="text-xs text-slate-500">
                        Real-time stage tracking across company plants and departments
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onOpenDashboard}
                        className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-500 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        📊 View Dashboard
                    </button>
                    {/* New Project Trigger */}
                    <button
                        onClick={onOpenModal}
                        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow cursor-pointer"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        New Project
                    </button>
                </div>
            </div>
        </header>
    );
}