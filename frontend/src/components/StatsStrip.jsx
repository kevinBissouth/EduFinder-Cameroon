function StatsStrip({ allCount, cityCount, regionCount }) {
  const stats = [
    { value: `${allCount}+`, label: 'Schools listed', color: 'text-[#0d7a4f]' },
    { value: cityCount, label: 'Cities covered', color: 'text-[#d9a406]' },
    { value: regionCount, label: 'Regions reached', color: 'text-[#b45309]' },
  ]

  return (
    <section className="border-y border-[#dcebe3] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-[#dcebe3] px-4 py-8 sm:px-6 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="px-4 text-center sm:px-8">
            <p className={`font-display text-2xl font-normal tabular-nums sm:text-3xl ${stat.color}`}>
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-[#343a44] sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StatsStrip