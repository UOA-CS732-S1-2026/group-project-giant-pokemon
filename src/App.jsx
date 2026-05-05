import { useState } from 'react'
import AppLayout from './components/layout/AppLayout.jsx'
import Auth from './pages/Auth.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Goals from './pages/Goals.jsx'
import Progress from './pages/Progress.jsx'
import Profile from './pages/Profile.jsx'
import Schedule from './pages/Schedule.jsx'
import Tasks from './pages/Tasks.jsx'

const initialGoals = [
  {
    id: 1,
    title: 'Complete COMPSCI 732 Project',
    type: 'Long-term',
    category: 'Study',
    targetDate: '2026-06-15',
    progress: 45,
  },
  {
    id: 2,
    title: 'Master React Frontend',
    type: 'Short-term',
    category: 'Career',
    targetDate: '2026-05-30',
    progress: 65,
  },
  {
    id: 3,
    title: 'Improve Daily Productivity',
    type: 'Long-term',
    category: 'Personal',
    targetDate: '2026-07-01',
    progress: 30,
  },
]

const initialTasks = [
  {
    id: 1,
    title: 'Review project requirements',
    relatedGoal: 'Complete COMPSCI 732 Project',
    priority: 'High',
    category: 'Study',
    dueDate: '2026-05-05',
    duration: 60,
    status: 'Pending',
    subtasks: [
      { id: 1, title: 'Read rubric', completed: false },
      { id: 2, title: 'Identify MVP features', completed: false },
    ],
  },
  {
    id: 2,
    title: 'Build dashboard layout',
    relatedGoal: 'Master React Frontend',
    priority: 'High',
    category: 'Career',
    dueDate: '2026-05-06',
    duration: 90,
    status: 'In Progress',
    subtasks: [
      { id: 1, title: 'Sidebar', completed: true },
      { id: 2, title: 'Topbar', completed: true },
      { id: 3, title: 'Stat cards', completed: false },
    ],
  },
  {
    id: 3,
    title: 'Create task management UI',
    relatedGoal: 'Complete COMPSCI 732 Project',
    priority: 'Medium',
    category: 'Study',
    dueDate: '2026-05-07',
    duration: 120,
    status: 'Pending',
    subtasks: [
      { id: 1, title: 'Add form', completed: false },
      { id: 2, title: 'Task cards', completed: false },
      { id: 3, title: 'Subtask list', completed: false },
    ],
  },
  {
    id: 4,
    title: 'Practice daily planning',
    relatedGoal: 'Improve Daily Productivity',
    priority: 'Low',
    category: 'Personal',
    dueDate: '2026-05-08',
    duration: 30,
    status: 'Completed',
    subtasks: [
      { id: 1, title: 'Review schedule', completed: true },
      { id: 2, title: 'Mark completed tasks', completed: true },
    ],
  },
]

function PlaceholderPage({ message }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-lg shadow-blue-950/20">
      <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30" />
      <h2 className="text-2xl font-bold text-white">{message}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-300">
        This section will be built in a future step of the TASKFLOW AI
        prototype.
      </p>
    </section>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [goals, setGoals] = useState(initialGoals)
  const [tasks, setTasks] = useState(initialTasks)

  function handleAuthSuccess() {
    setIsAuthenticated(true)
    setCurrentPage('dashboard')
  }

  function handleLogout() {
    setIsAuthenticated(false)
    setCurrentPage('dashboard')
  }

  function renderPage() {
    if (currentPage === 'dashboard') {
      return <Dashboard onNavigate={setCurrentPage} />
    }

    if (currentPage === 'goals') {
      return <Goals goals={goals} setGoals={setGoals} />
    }

    if (currentPage === 'tasks') {
      return <Tasks goals={goals} tasks={tasks} setTasks={setTasks} />
    }

    if (currentPage === 'schedule') {
      return <Schedule tasks={tasks} />
    }

    if (currentPage === 'progress') {
      return <Progress tasks={tasks} />
    }

    if (currentPage === 'profile') {
      return <Profile goals={goals} tasks={tasks} />
    }

    return <PlaceholderPage message="Page coming next" />
  }

  if (isAuthenticated) {
    return (
      <AppLayout
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AppLayout>
    )
  }

  return <Auth onAuthSuccess={handleAuthSuccess} />
}

export default App
