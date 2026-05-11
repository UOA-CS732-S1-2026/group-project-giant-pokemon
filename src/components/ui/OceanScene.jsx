import { useState } from 'react'
import {
  calculateOceanHealth,
  flattenOceanItems,
} from '../../utils/progressCalculations.js'
import OceanItem from './OceanItem.jsx'
import OceanItemModal from './OceanItemModal.jsx'

const rubbishIcons = ['🧴', '🛞', '🗑️', '🥤']
const lifeIcons = ['🐟', '🐠', '🐢', '🌿', '🪸']

function getOceanState(health, totalTasks) {
  if (totalTasks === 0) {
    return {
      label: 'Empty Ocean',
      message: 'Add tasks to begin restoring your productivity ocean.',
      sceneClass: 'from-cyan-500/20 via-blue-700/20 to-slate-950/80',
    }
  }

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
  const hasNoTasks = tasks.length === 0
  const oceanState = getOceanState(oceanHealth, tasks.length)
  const oceanItems = flattenOceanItems(tasks)

  const shouldScroll = oceanItems.length > 20
  const oceanGridClass = 'grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6'

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
        className={`relative mb-5 min-h-[320px] rounded-3xl border border-white/10 bg-blue-950/30 ${
          shouldScroll ? 'max-h-[640px] overflow-y-auto' : 'overflow-hidden'
        }`}
      >
        <div className="pointer-events-none sticky top-0 z-0 h-16 overflow-hidden">
          <div className="animate-wave-move absolute left-[-20%] top-3 h-14 w-[140%] rounded-[50%] bg-white/10 blur-sm" />
          <div className="animate-wave-move absolute bottom-0 left-[-20%] h-12 w-[140%] rounded-[50%] bg-cyan-300/10 blur-sm [animation-delay:1.4s]" />
        </div>

        {hasNoTasks ? (
          <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-slate-200">
            No tasks yet. Add tasks to begin restoring your ocean.
          </div>
        ) : (
          <div className={`relative z-10 p-5 ${oceanGridClass}`}>
            {oceanItems.map((item, index) => {
              const icons = item.iconType === 'life' ? lifeIcons : rubbishIcons
              const icon = icons[index % icons.length]

              return (
                <OceanItem
                  key={item.id}
                  icon={icon}
                  label={item.title}
                  type={item.iconType}
                  size={item.size}
                  delay={index * 80}
                  onClick={() => setSelectedItem({ ...item, icon })}
                />
              )
            })}
          </div>
        )}
      </div>

      <p className="mb-5 rounded-2xl border border-blue-300/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
        Every task and subtask affects your ocean. Completing small subtasks
        slowly restores life, while completing full tasks removes larger
        pollution.
      </p>

      {oceanHealth === 100 && !hasNoTasks && (
        <div className="rounded-3xl border border-emerald-300/30 bg-emerald-500/15 p-5 text-center font-semibold text-emerald-100">
          All rubbish has been cleared. Your ocean is thriving.
        </div>
      )}

      <OceanItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </section>
  )
}

export default OceanScene
