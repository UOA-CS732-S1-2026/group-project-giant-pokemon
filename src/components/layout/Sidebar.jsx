const navigationItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'goals', label: 'Goals' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'progress', label: 'Progress' },
  { id: 'profile', label: 'Profile' },
]

function Sidebar({ currentPage, onPageChange, onLogout }) {
  return (
    <aside className="flex w-full flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur lg:min-h-[calc(100vh-3rem)] lg:w-72">
      <div className="mb-8 flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30" />
        <div>
          <p className="text-lg font-bold text-white">TASKFLOW AI</p>
          <p className="text-xs font-medium text-blue-200">Plan smarter</p>
        </div>
      </div>

      <nav className="grid gap-2 lg:flex lg:flex-1 lg:flex-col">
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onPageChange(item.id)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 rounded-2xl border border-blue-300/30 px-4 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        Logout
      </button>
    </aside>
  )
}

export default Sidebar
