function OceanItem({
  icon,
  label,
  type,
  variant,
  size = 'large',
  delay = 0,
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
      aria-label={label}
      onClick={onClick}
      style={{
        animationDelay: `${delay}ms`,
      }}
      className={`mx-auto flex items-center justify-center rounded-full bg-transparent text-center drop-shadow-[0_8px_14px_rgba(15,23,42,0.55)] transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
        isSmall ? 'h-14 w-14 text-3xl' : 'h-20 w-20 text-5xl'
      } ${animationClass}`}
    >
      <span aria-hidden="true">
        {icon}
      </span>
    </button>
  )
}

export default OceanItem
