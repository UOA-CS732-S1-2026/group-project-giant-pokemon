function StatCard({ label, value }) {
  return (
    <article className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-blue-950/20">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-3 whitespace-normal text-xl font-bold leading-tight text-white sm:text-2xl">
        {value}
      </p>
    </article>
  )
}

export default StatCard
