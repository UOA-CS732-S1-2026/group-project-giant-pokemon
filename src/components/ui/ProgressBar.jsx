function ProgressBar({ value }) {
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-900/80">
      <div
        className="h-full rounded-full bg-blue-500 shadow-lg shadow-blue-500/40 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}

export default ProgressBar
