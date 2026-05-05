function BadgeCard({ badge }) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-lg shadow-blue-950/20 transition ${
        badge.unlocked
          ? 'border-blue-300/30 bg-blue-500/10'
          : 'border-white/10 bg-white/5 opacity-60'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${
            badge.unlocked ? 'bg-blue-500/30' : 'bg-slate-950/70'
          }`}
        >
          {badge.icon}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-white">{badge.name}</h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                badge.unlocked
                  ? 'bg-emerald-500/20 text-emerald-100'
                  : 'bg-slate-700/70 text-slate-300'
              }`}
            >
              {badge.unlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {badge.description}
          </p>
        </div>
      </div>
    </article>
  )
}

export default BadgeCard
