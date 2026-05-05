import { useState } from 'react'

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function Auth({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login')
  const [formData, setFormData] = useState(initialForm)
  const [error, setError] = useState('')

  const isLogin = activeTab === 'login'

  function handleTabChange(tab) {
    setActiveTab(tab)
    setError('')
    setFormData(initialForm)
  }

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))
  }

  function validateForm() {
    if (!isLogin && !formData.fullName.trim()) {
      return 'Please enter your full name.'
    }

    if (!formData.email.trim()) {
      return 'Please enter your email address.'
    }

    if (!formData.password) {
      return 'Please enter your password.'
    }

    if (!isLogin && formData.confirmPassword !== formData.password) {
      return 'Passwords do not match.'
    }

    return ''
  }

  function handleSubmit(event) {
    event.preventDefault()

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    onAuthSuccess()
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_35%,#020617_100%)] px-6 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-blue-950/40 backdrop-blur">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30" />
          <h1 className="text-3xl font-bold tracking-wide text-white">
            TASKFLOW AI
          </h1>
          <p className="mt-2 text-sm font-medium text-blue-200">
            Smart Scheduling Assistant
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-950/60 p-1">
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              isLogin
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              !isLogin
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            New User
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Full Name
              </span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          {!isLogin && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Confirm Password
              </span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              />
            </label>
          )}

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-blue-500 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Auth
