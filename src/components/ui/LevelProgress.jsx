import ProgressBar from './ProgressBar.jsx'

const levels = [
  'Level 1 Starter',
  'Level 2 Organizer',
  'Level 3 Planner',
  'Level 4 Achiever',
  'Level 5 Master Scheduler',
  'Level 6 Ocean Guardian',
]

function LevelProgress({ totalXP, levelInfo }) {
  const progressValue = levelInfo.levelProgressPercent
  const nextLevelText =
    levelInfo.nextLevelXP === null ? 'Max Level' : `${levelInfo.nextLevelXP} XP`
  const neededText =
    levelInfo.nextLevelXP === null
      ? 'Highest level reached'
      : `${levelInfo.xpNeededForNextLevel} XP needed to reach the next level`

  return (
    <section className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-blue-950/20">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Level Progress</h3>
          <p className="mt-1 text-sm text-slate-300">
            {totalXP} / {nextLevelText}
          </p>
        </div>
        <p className="text-sm font-semibold text-blue-200">
          {neededText}
        </p>
      </div>

      <ProgressBar value={progressValue} />

      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {levels.map((level) => {
          const isCurrentLevel = level === levelInfo.currentLevelLabel

          return (
            <div
              key={level}
              className={`rounded-2xl border px-3 py-3 text-center text-xs font-semibold ${
                isCurrentLevel
                  ? 'border-blue-300/40 bg-blue-500/20 text-blue-100'
                  : 'border-white/10 bg-slate-950/50 text-slate-300'
              }`}
            >
              {level}
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default LevelProgress
