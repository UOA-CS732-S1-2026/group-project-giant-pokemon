import { useState } from 'react'
import ScheduleBlock from '../components/ui/ScheduleBlock.jsx'

const priorityOrder = {
  High: 1,
  Medium: 2,
  Low: 3,
}

const initialPreferences = {
  startTime: '09:00',
  endTime: '17:00',
  breakDuration: 15,
  dailyFocus: 'Balanced',
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

function Schedule({
  tasks,
  generatedSchedule,
  setGeneratedSchedule,
  setScheduleGenerated,
}) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [name]: name === 'breakDuration' ? Number(value) : value,
    }))
  }

  function getTasksForSchedule() {
    const activeTasks = tasks.filter((task) => task.status !== 'Completed')

    return [...activeTasks].sort(
      (firstTask, secondTask) =>
        priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority],
    )
  }

  function handleGenerateSchedule() {
    const startMinutes = timeToMinutes(preferences.startTime)
    const endMinutes = timeToMinutes(preferences.endTime)
    const breakDuration = Number(preferences.breakDuration)

    if (startMinutes >= endMinutes) {
      setError('Please choose an end time after the start time.')
      return
    }

    let currentTime = startMinutes
    const generatedBlocks = []

    for (const task of getTasksForSchedule()) {
      const taskEndTime = currentTime + Number(task.duration)

      if (taskEndTime > endMinutes) {
        break
      }

      generatedBlocks.push({
        id: task.id,
        title: task.title,
        relatedGoal: task.relatedGoal,
        priority: task.priority,
        category: task.category,
        duration: task.duration,
        timeRange: `${minutesToTime(currentTime)} - ${minutesToTime(taskEndTime)}`,
        replanned: false,
      })

      currentTime = taskEndTime + breakDuration
    }

    setGeneratedSchedule(generatedBlocks)
    setScheduleGenerated(generatedBlocks.length > 0)
    setMessage('')
    setError('')
  }

  function handleReplanMissedTasks() {
    if (generatedSchedule.length === 0) {
      setMessage('Generate a schedule first, then re-plan missed tasks.')
      return
    }

    setGeneratedSchedule((currentBlocks) =>
      currentBlocks.map((block, index) =>
        index === currentBlocks.length - 1 ? { ...block, replanned: true } : block,
      ),
    )
    setMessage(
      'Schedule updated. Missed tasks have been moved to the next available focus block.',
    )
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <h2 className="text-3xl font-bold text-white">AI Schedule</h2>
        <p className="mt-2 max-w-3xl text-slate-300">
          Generate a realistic daily plan from your goals, tasks, priorities and
          available time.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
        <div className="mb-5">
          <h3 className="text-xl font-bold text-white">Planning Preferences</h3>
          <p className="mt-1 text-sm text-slate-300">
            Set the available focus window for today.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Start time
            </span>
            <input
              type="time"
              name="startTime"
              value={preferences.startTime}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              End time
            </span>
            <input
              type="time"
              name="endTime"
              value={preferences.endTime}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Break duration in minutes
            </span>
            <input
              type="number"
              name="breakDuration"
              min="0"
              value={preferences.breakDuration}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">
              Daily focus
            </span>
            <select
              name="dailyFocus"
              value={preferences.dailyFocus}
              onChange={handleChange}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            >
              <option>Study</option>
              <option>Career</option>
              <option>Health</option>
              <option>Personal</option>
              <option>Balanced</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerateSchedule}
          className="mt-5 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Generate Schedule
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
          <h3 className="text-xl font-bold text-white">Generated Plan</h3>
          <p className="mt-1 text-sm text-slate-300">
            High priority tasks are placed first.
          </p>

          <div className="mt-5 space-y-4">
            {generatedSchedule.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
                No schedule generated yet. Choose your preferences and click
                Generate Schedule.
              </p>
            ) : (
              generatedSchedule.map((block) => (
                <ScheduleBlock key={`${block.id}-${block.timeRange}`} block={block} />
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
            <h3 className="text-xl font-bold text-white">Fixed Commitments</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm font-bold text-blue-200">
                  12:30 PM - 1:00 PM
                </p>
                <p className="mt-1 text-slate-100">Lunch Break</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-sm font-bold text-blue-200">
                  4:00 PM - 4:30 PM
                </p>
                <p className="mt-1 text-slate-100">Review & Reflection</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
            <h3 className="text-xl font-bold text-white">Re-planning Preview</h3>
            <p className="mt-1 text-sm text-slate-300">
              Preview how missed work can move into the next open focus block.
            </p>
            <button
              type="button"
              onClick={handleReplanMissedTasks}
              className="mt-5 w-full rounded-2xl border border-blue-300/30 px-5 py-3 text-sm font-semibold text-blue-100 transition hover:border-blue-200 hover:bg-blue-500/20"
            >
              Re-plan Missed Tasks
            </button>
            {message && (
              <p className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {message}
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  )
}

export default Schedule
