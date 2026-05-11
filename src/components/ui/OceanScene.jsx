import { useState } from 'react'
import {
  calculateOceanHealth,
  calculateTaskProgress,
} from '../../utils/progressCalculations.js'
import OceanItem from './OceanItem.jsx'
import OceanItemModal from './OceanItemModal.jsx'

const rubbishIcons = ['🧴', '🛞', '🗑️', '🥤']
const lifeIcons = ['🐟', '🐠', '🐢', '🌿', '🪸']

function getOceanState(health) {
  if (health === 100) {
    return {
      label: 'Thriving',
      message: 'Your ocean is clean and thriving!',
      sceneClass: 'from-cyan-300/35 via-blue-500/20 to-emerald-500/20',
    }
  }

  if (health >= 71) {
    return {
      label: 'Healthy',
      message: 'Your ocean is healthy. Almost fully restored.',
      sceneClass: 'from-cyan-400/30 via-blue-500/20 to-slate-950/70',
    }
  }

  if (health >= 31) {
    return {
      label: 'Recovering',
      message: 'Your ocean is recovering.',
      sceneClass: 'from-blue-500/25 via-cyan-600/10 to-slate-950/80',
    }
  }

  return {
    label: 'Polluted',
    message: 'Your ocean is polluted. Complete tasks to clean it.',
    sceneClass: 'from-slate-700/60 via-blue-950/70 to-slate-950',
  }
}

function OceanScene({ tasks }) {
  const [selectedItem, setSelectedItem] = useState(null)
  const oceanHealth = calculateOceanHealth(tasks)
  const oceanState = getOceanState(oceanHealth)
  const incompleteTasks = tasks.filter((task) => calculateTaskProgress(task) < 1)
  const completedTasks = tasks.filter((task) => calculateTaskProgress(task) === 1)
  const incompleteSubtasks = tasks.flatMap((task) =>
    (task.subtasks || [])
      .filter((subtask) => !subtask.completed)
      .map((subtask) => ({
        ...subtask,
        taskTitle: task.title,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        description: task.description,
      })),
  )
  const completedSubtasks = tasks.flatMap((task) =>
    (task.subtasks || [])
      .filter((subtask) => subtask.completed)
      .map((subtask) => ({
        ...subtask,
        taskTitle: task.title,
        priority: task.priority,
        category: task.category,
        dueDate: task.dueDate,
        description: task.description,
      })),
  )
  const hasNoTasks = tasks.length === 0
  const isCleanOcean = tasks.length > 0 && incompleteTasks.length === 0
  const hasNoMarineLife =
    tasks.length > 0 && completedTasks.length === 0 && completedSubtasks.length === 0
  const rubbishItems = [
    ...incompleteTasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      taskTitle: task.title,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      description: task.description,
      size: 'large',
      type: 'rubbish',
    })),
    ...incompleteSubtasks.map((subtask) => ({
      id: `subtask-${subtask.taskTitle}-${subtask.id}`,
      title: `${subtask.title} (${subtask.taskTitle})`,
      taskTitle: subtask.taskTitle,
      subtaskTitle: subtask.title,
      priority: subtask.priority,
      category: subtask.category,
      dueDate: subtask.dueDate,
      description: subtask.description,
      size: 'small',
      type: 'rubbish',
    })),
  ]
  const lifeItems = [
    ...completedTasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      taskTitle: task.title,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
      description: task.description,
      size: 'large',
      type: 'life',
    })),
    ...completedSubtasks.map((subtask) => ({
      id: `subtask-${subtask.taskTitle}-${subtask.id}`,
      title: `${subtask.title} (${subtask.taskTitle})`,
      taskTitle: subtask.taskTitle,
      subtaskTitle: subtask.title,
      priority: subtask.priority,
      category: subtask.category,
      dueDate: subtask.dueDate,
      description: subtask.description,
      size: 'small',
      type: 'life',
    })),
  ]
  const totalItems = rubbishItems.length + lifeItems.length
  const shouldScroll = totalItems > 20
  const zoneGridClass = 'grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6'

  return (
    <section
      className={`overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b ${oceanState.sceneClass} p-6 shadow-2xl shadow-blue-950/30`}
    >
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Ocean Scene</h3>
          <p className="mt-1 text-sm text-blue-100">{oceanState.message}</p>
        </div>
        <span className="rounded-full bg-blue-500/20 px-4 py-2 text-sm font-semibold text-blue-100">
          {oceanState.label}
        </span>
      </div>

      <div
        className={`relative mb-5 min-h-[300px] rounded-3xl border border-white/10 bg-blue-950/30 ${
          shouldScroll ? 'max-h-[620px] overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        <div className="pointer-events-none sticky top-0 z-0 h-16 overflow-hidden">
          <div className="animate-wave-move absolute left-[-20%] top-3 h-14 w-[140%] rounded-[50%] bg-white/10 blur-sm" />
          <div className="animate-wave-move absolute bottom-0 left-[-20%] h-12 w-[140%] rounded-[50%] bg-cyan-300/10 blur-sm [animation-delay:1.4s]" />
        </div>

        {hasNoTasks && (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-200">
            No tasks yet. Add tasks to begin restoring your ocean.
          </div>
        )}

        {!hasNoTasks && (
          <div className="relative z-10 grid gap-5 p-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-red-300/20 bg-red-500/10 p-4">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="font-bold text-white">Pollution Zone</h4>
                  <p className="text-sm text-red-100">
                    {rubbishItems.length} visible rubbish items
                  </p>
                </div>
              </div>

              {rubbishItems.length === 0 ? (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-100">
                  No rubbish remains in this zone.
                </div>
              ) : (
                <div className={zoneGridClass}>
                  {rubbishItems.map((item, index) => (
                    <OceanItem
                      key={item.id}
                      icon={rubbishIcons[index % rubbishIcons.length]}
                      label={item.title}
                      type="rubbish"
                      size={item.size}
                      delay={index * 80}
                      onClick={() =>
                        setSelectedItem({
                          ...item,
                          icon: rubbishIcons[index % rubbishIcons.length],
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-4">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h4 className="font-bold text-white">Life Zone</h4>
                  <p className="text-sm text-emerald-100">
                    {lifeItems.length} visible life items
                  </p>
                </div>
              </div>

              {lifeItems.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm font-medium text-slate-200">
                  No marine life yet. Complete your first task to bring life back.
                </div>
              ) : (
                <div className={zoneGridClass}>
                  {lifeItems.map((item, index) => (
                    <OceanItem
                      key={item.id}
                      icon={lifeIcons[index % lifeIcons.length]}
                      label={item.title}
                      type="life"
                      size={item.size}
                      delay={index * 90}
                      completed
                      onClick={() =>
                        setSelectedItem({
                          ...item,
                          icon: lifeIcons[index % lifeIcons.length],
                        })
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mb-5 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        Every task and subtask affects your ocean. Completing small subtasks
        slowly restores life, while completing full tasks removes larger
        pollution.
      </p>

      {isCleanOcean && (
        <div className="mb-5 rounded-3xl border border-emerald-300/30 bg-emerald-500/15 p-5 text-center font-semibold text-emerald-100">
          All rubbish has been cleared. Your ocean is thriving.
        </div>
      )}

      {!hasNoTasks && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-red-300/20 bg-red-500/10 p-5">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white">Pollution Zone</h4>
              <p className="mt-1 text-sm text-red-100">
                {incompleteTasks.length} large rubbish and{' '}
                {incompleteSubtasks.length} small fragments remaining
              </p>
            </div>

            {incompleteTasks.length === 0 && incompleteSubtasks.length === 0 ? (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-5 text-sm font-medium text-emerald-100">
                No rubbish remains in this zone.
              </div>
            ) : (
              <div className="rounded-2xl border border-red-300/10 bg-slate-950/40 p-4 text-sm text-red-100">
                Rubbish is floating in the ocean scene above.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
            <div className="mb-4">
              <h4 className="text-lg font-bold text-white">
                Restored Life Zone
              </h4>
              <p className="mt-1 text-sm text-emerald-100">
                {completedTasks.length} large marine life and{' '}
                {completedSubtasks.length} small life restored
              </p>
            </div>

            {hasNoMarineLife ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm font-medium text-slate-200">
                No marine life yet. Complete your first task to bring life back.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-300/10 bg-slate-950/40 p-4 text-sm text-emerald-100">
                Restored marine life is swimming in the ocean scene above.
              </div>
            )}
          </div>
        </div>
      )}

      <OceanItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}

export default OceanScene
