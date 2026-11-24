import SHPLLogo from '../assets/sohanhealthcare_logo_transparent.png';

export default function Navbar({
    permissions = {},
    onOpenModal,
    onOpenDashboard,
    onOpenPCDashboard,
}) {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
            <div className="flex gap-3">
                <div className="flex">
                    <img src={SHPLLogo} alt="SHPL Brand Logo" className="w-32" />
                </div>

                <div className="mx-3 flex w-full items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                            Project Management Center
                        </h1>
                        <p className="text-xs text-slate-500">
                            Real-time stage tracking across company plants and departments
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {permissions.canViewDashboard && (
                            <button
                                onClick={onOpenDashboard}
                                className="flex items-center gap-2 cursor-pointer rounded-lg bg-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-300 transition-colors"
                            >
                                📊 View Dashboard
                            </button>
                        )}

                        {permissions.canViewPCDashboard && (
                            <button
                                onClick={onOpenPCDashboard}
                                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                                📋PC Dashboard
                            </button>
                        )}

                        {permissions.canViewCreateProject && (
                            // New Project Trigger
                            <button
                                onClick={onOpenModal}
                                className="flex items-center gap-2 rounded-lg bg-[#0aa0d3] px-4 py-2 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#0882ac] hover:shadow cursor-pointer"
                            >
                                + New Project
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}