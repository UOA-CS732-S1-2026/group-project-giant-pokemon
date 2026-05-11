function OceanItem({
  icon,
  label,
  type,
  variant,
  size = 'large',
  delay = 0,
  completed = false,
  onClick,
}) {
  const itemType = type || variant
  const isLife = itemType === 'life'
  const isSmall = size === 'small'
  const animationClass = isLife
    ? 'animate-swim animate-fade-in-pop'
    : 'animate-float-slow'

  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      style={{
        animationDelay: `${delay}ms`,
      }}
      className={`flex w-full flex-col items-center justify-center rounded-3xl border text-center shadow-lg shadow-blue-950/20 transition hover:-translate-y-1 hover:border-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        isSmall ? 'min-h-20 p-3' : 'min-h-28 p-4'
      } ${
        isLife
          ? 'border-emerald-300/30 bg-emerald-500/15'
          : 'border-red-300/30 bg-red-500/15'
      } ${isSmall ? 'w-28' : 'w-36'} ${animationClass}`}
    >
      <span className={isSmall ? 'text-2xl' : 'text-4xl'} aria-hidden="true">
        {icon}
      </span>
      <p className="mt-3 line-clamp-2 text-xs font-semibold text-slate-100">
        {label}
      </p>
      {completed && (
        <span className="mt-2 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-100">
          Restored
        </span>
      )}
    </button>
  )
}

export default OceanItem
