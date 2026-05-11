import { useState } from 'react'
import TaskCard from '../components/ui/TaskCard.jsx'

function createEmptyTaskForm(goals) {
  return {
    title: '',
    relatedGoal: goals[0]?.title || '',
    priority: 'Medium',
    category: 'Study',
    dueDate: '',
    duration: 30,
  }
}

function Tasks({ goals, tasks, setTasks }) {
  const [formData, setFormData] = useState(createEmptyTaskForm(goals))
  const [subtaskText, setSubtaskText] = useState('')
  const [draftSubtasks, setDraftSubtasks] = useState([])
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isEditing = editingTaskId !== null

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: name === 'duration' ? Number(value) : value,
    }))
  }

  function addDraftSubtask() {
    if (!subtaskText.trim()) {
      return
    }

    setDraftSubtasks((currentSubtasks) => [
      ...currentSubtasks,
      {
        id: Date.now(),
        title: subtaskText.trim(),
        completed: false,
      },
    ])
    setSubtaskText('')
  }

  function removeDraftSubtask(subtaskId) {
    setDraftSubtasks((currentSubtasks) =>
      currentSubtasks.filter((subtask) => subtask.id !== subtaskId),
    )
  }

  function resetForm() {
    setFormData(createEmptyTaskForm(goals))
    setDraftSubtasks([])
    setSubtaskText('')
    setEditingTaskId(null)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!formData.title.trim()) {
      setError('Please enter a task title.')
      return
    }

    if (!formData.dueDate) {
      setError('Please choose a due date.')
      return
    }

    if (Number(formData.duration) <= 0) {
      setError('Please enter a duration greater than 0.')
      return
    }

    const existingTask = isEditing
      ? tasks.find((task) => task.id === editingTaskId)
      : null
    const allDraftSubtasksCompleted =
      draftSubtasks.length > 0 &&
      draftSubtasks.every((subtask) => subtask.completed)
    const hasCompletedDraftSubtask = draftSubtasks.some(
      (subtask) => subtask.completed,
    )
    const nextStatus =
      draftSubtasks.length > 0
        ? allDraftSubtasksCompleted
          ? 'Completed'
          : hasCompletedDraftSubtask || existingTask?.status === 'Completed'
            ? 'In Progress'
            : existingTask?.status || 'Pending'
        : existingTask?.status || 'Pending'

    const taskToSave = {
      ...formData,
      title: formData.title.trim(),
      duration: Number(formData.duration),
      status: nextStatus,
      completedAt:
        nextStatus === 'Completed'
          ? existingTask?.completedAt || new Date().toISOString()
          : null,
      subtasks: draftSubtasks,
    }

    if (isEditing) {
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === editingTaskId ? { ...taskToSave, id: editingTaskId } : task,
        ),
      )
    } else {
      setTasks((currentTasks) => [
        { ...taskToSave, id: Date.now() },
        ...currentTasks,
      ])
    }

    setSuccessMessage('')
    resetForm()
  }

  function handleEdit(task) {
    setFormData({
      title: task.title,
      relatedGoal: task.relatedGoal,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      duration: task.duration,
    })
    setDraftSubtasks(task.subtasks)
    setEditingTaskId(task.id)
    setError('')
    setSuccessMessage('')
  }

  function handleDelete(taskId) {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))

    if (editingTaskId === taskId) {
      resetForm()
    }
  }

  function handleMarkComplete(taskId) {
    const completedAt = new Date().toISOString()
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      return {
        ...task,
        status: 'Completed',
        completedAt,
        subtasks: task.subtasks.map((subtask) => ({
          ...subtask,
          completed: true,
        })),
      }
    })

    setTasks(updatedTasks)

    setSuccessMessage('Progress updated! Your Productivity Ocean is recovering.')
  }

  function handleToggleSubtask(taskId, subtaskId) {
    const updatedTasks = tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      const updatedSubtasks = task.subtasks.map((subtask) => {
        if (subtask.id !== subtaskId) {
          return subtask
        }

        return {
          ...subtask,
          completed: !subtask.completed,
        }
      })
      const allSubtasksCompleted =
        updatedSubtasks.length > 0 &&
        updatedSubtasks.every((subtask) => subtask.completed)

      return {
        ...task,
        status: allSubtasksCompleted ? 'Completed' : 'In Progress',
        completedAt: allSubtasksCompleted ? task.completedAt || new Date().toISOString() : null,
        subtasks: updatedSubtasks,
      }
    })

    setTasks(updatedTasks)

    setSuccessMessage('Progress updated! Your Productivity Ocean is recovering.')
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">Your Tasks</h2>
        <p className="mt-2 text-slate-300">
          Break your goals into clear, actionable work.
        </p>
      </section>

      {successMessage && (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-100">
          {successMessage}
        </section>
      )}

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">
            {isEditing ? 'Edit Task' : 'Add Task'}
          </h3>
          <p className="mt-1 text-sm text-slate-300">
            Add the work items that move your goals forward.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Task title
            </span>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter a task title"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Related goal
            </span>
            <select
              name="relatedGoal"
              value={formData.relatedGoal}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              {goals.map((goal) => (
                <option key={goal.id} value={goal.title}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Priority
            </span>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
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
              Due date
            </span>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Estimated duration in minutes
            </span>
            <input
              type="number"
              name="duration"
              min="1"
              value={formData.duration}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <div className="lg:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Subtasks
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={subtaskText}
                onChange={(event) => setSubtaskText(event.target.value)}
                placeholder="Enter a subtask"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              />
              <button
                type="button"
                onClick={addDraftSubtask}
                className="rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
              >
                Add Subtask
              </button>
            </div>

            {draftSubtasks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {draftSubtasks.map((subtask) => (
                  <span
                    key={subtask.id}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
                  >
                    {subtask.title}
                    <button
                      type="button"
                      onClick={() => removeDraftSubtask(subtask.id)}
                      className="font-bold text-blue-200 hover:text-white"
                    >
                      Remove
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

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
              {isEditing ? 'Save Task' : 'Add Task'}
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
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMarkComplete={handleMarkComplete}
            onToggleSubtask={handleToggleSubtask}
          />
        ))}
      </section>
    </div>
  )
}

export default Tasks
