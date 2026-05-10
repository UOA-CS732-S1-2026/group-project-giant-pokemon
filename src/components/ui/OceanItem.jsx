function OceanItem({ icon, label, variant, onComplete }) {
  const isLife = variant === 'life'

  return (
    <div
      title={label}
      className={`flex min-h-24 flex-col items-center justify-center rounded-3xl border p-4 text-center shadow-lg shadow-blue-950/20 ${
        isLife
          ? 'border-emerald-300/30 bg-emerald-500/15'
          : 'border-red-300/30 bg-red-500/15'
      }`}
    >
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <p className="mt-3 line-clamp-2 text-xs font-semibold text-slate-100">
        {label}
      </p>
      {!isLife && onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="mt-4 rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Complete Task
        </button>
      )}
    </div>
  )
}

export default OceanItem
