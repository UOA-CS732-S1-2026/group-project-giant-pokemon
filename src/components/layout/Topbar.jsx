const pageTitles = {
  dashboard: 'Dashboard',
  goals: 'Goals',
  tasks: 'Tasks',
  schedule: 'Schedule',
  progress: 'Progress',
  profile: 'Profile',
}

function Topbar({ currentPage, onProfileClick }) {
  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-blue-950/20 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {pageTitles[currentPage]}
        </h1>
        <p className="mt-1 text-sm text-blue-200">
          Goal-Driven AI Scheduling Assistant
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100">
          240 XP
        </span>
        <button
          type="button"
          onClick={onProfileClick}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          aria-label="Open profile"
        >
          SA
        </button>
      </div>
    </header>
  )
}

export default Topbar
