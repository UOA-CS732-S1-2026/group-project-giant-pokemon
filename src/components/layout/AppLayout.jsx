import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'

function AppLayout({ children, currentPage, onPageChange, onLogout }) {
  return (
    <main className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)] p-4 text-white sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row">
        <Sidebar
          currentPage={currentPage}
          onPageChange={onPageChange}
          onLogout={onLogout}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <Topbar
            currentPage={currentPage}
            onProfileClick={() => onPageChange('profile')}
          />
          <div>{children}</div>
        </div>
      </div>
    </main>
  )
}

export default AppLayout
