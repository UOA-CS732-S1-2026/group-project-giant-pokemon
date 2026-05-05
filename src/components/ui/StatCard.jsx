function StatCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-blue-950/20">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </article>
  )
}

export default StatCard
