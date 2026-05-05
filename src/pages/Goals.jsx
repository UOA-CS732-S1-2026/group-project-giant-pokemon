import { useState } from 'react'
import GoalCard from '../components/ui/GoalCard.jsx'

const emptyGoalForm = {
  title: '',
  type: 'Short-term',
  category: 'Study',
  targetDate: '',
  progress: 0,
}

function Goals({ goals, setGoals }) {
  const [formData, setFormData] = useState(emptyGoalForm)
  const [editingGoalId, setEditingGoalId] = useState(null)
  const [error, setError] = useState('')

  const isEditing = editingGoalId !== null

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: name === 'progress' ? Number(value) : value,
    }))
  }

  function resetForm() {
    setFormData(emptyGoalForm)
    setEditingGoalId(null)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!formData.title.trim()) {
      setError('Please enter a goal title.')
      return
    }

    if (!formData.targetDate) {
      setError('Please choose a target date.')
      return
    }

    const goalToSave = {
      ...formData,
      title: formData.title.trim(),
      progress: Math.min(100, Math.max(0, Number(formData.progress))),
    }

    if (isEditing) {
      setGoals((currentGoals) =>
        currentGoals.map((goal) =>
          goal.id === editingGoalId ? { ...goalToSave, id: editingGoalId } : goal,
        ),
      )
    } else {
      setGoals((currentGoals) => [
        { ...goalToSave, id: Date.now() },
        ...currentGoals,
      ])
    }

    resetForm()
  }

  function handleEdit(goal) {
    setFormData({
      title: goal.title,
      type: goal.type,
      category: goal.category,
      targetDate: goal.targetDate,
      progress: goal.progress,
    })
    setEditingGoalId(goal.id)
    setError('')
  }

  function handleDelete(goalId) {
    setGoals((currentGoals) => currentGoals.filter((goal) => goal.id !== goalId))

    if (editingGoalId === goalId) {
      resetForm()
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">Your Goals</h2>
        <p className="mt-2 text-slate-300">
          Break long-term ambitions into manageable steps.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Goal' : 'Add Goal'}
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Capture the goal details your schedule should plan around.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Goal title
            </span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a goal title"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Goal type
            </span>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option>Short-term</option>
              <option>Long-term</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Category
            </span>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option>Study</option>
              <option>Health</option>
              <option>Career</option>
              <option>Personal</option>
              <option>Other</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Target date
            </span>
            <input
              type="date"
              name="targetDate"
              value={formData.targetDate}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Progress percentage
            </span>
            <input
              type="number"
              name="progress"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200 lg:col-span-2">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
            <button
              type="submit"
              className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              {isEditing ? 'Save Goal' : 'Add Goal'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </section>
    </div>
  )
}

export default Goals
