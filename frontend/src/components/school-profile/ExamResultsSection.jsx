import { useEffect, useState } from 'react'

import { useInView } from '../../hooks/useInView'
import { formatPercent } from '../../utils/format'

// Anneau de réussite façon maquette : dégradé vert ou doré selon le rang de
// l'examen, pourcentage au centre. Le cercle se remplit à l'apparition.
function PassRateRing({ rate, gold, delay }) {
  const [ringRef, inView] = useInView(0.2)
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    if (inView) setFilled(true)
  }, [inView])

  const radius = 52
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - (rate ?? 0) / 100)
  const gradientId = gold ? 'ring-gold' : 'ring-green'

  return (
    <div ref={ringRef} className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 128 128" className="h-32 w-32 -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {gold ? (
              <>
                <stop offset="0%" stopColor="#f2c14e" />
                <stop offset="100%" stopColor="#c29105" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#2ec27e" />
                <stop offset="100%" stopColor="#0a5e3d" />
              </>
            )}
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#eaf0ed" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={filled ? offset : circumference}
          style={{ transition: `stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1) ${delay}ms` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-[#081220]">
          {formatPercent(rate)}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#98a2ac]">
          Pass rate
        </span>
      </div>
    </div>
  )
}

// Résultats aux examens : une carte par examen avec l'anneau de la dernière
// session publiée — le taux le plus récent est ce qui compte dans la maquette.
// Masqué si aucun résultat n'est publié.
function ExamResultsSection({ examResults = [] }) {
  if (examResults.length === 0) return null

  const byExam = new Map()
  for (const result of examResults) {
    const current = byExam.get(result.exam)
    if (!current || Number(result.session) >= Number(current.session)) {
      byExam.set(result.exam, result)
    }
  }
  const latestPerExam = [...byExam.values()]

  return (
    <section id="results" className="scroll-mt-40">
      <h2 className="font-display text-3xl text-[#081220]">National exam results</h2>
      <p className="mt-2 text-sm text-[#5b6670]">Latest published session for each exam.</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {latestPerExam.map((result, index) => (
          <div
            key={result.exam}
            className="flex items-center gap-5 rounded-[14px] border border-[#e7ece9] bg-white p-6 shadow-[0_4px_24px_rgba(10,94,61,0.055)]"
          >
            <PassRateRing rate={Number(result.pass_rate)} gold={index % 2 === 1} delay={index * 90} />
            <div className="min-w-0">
              <p className="text-base font-bold text-[#081220]">{result.exam}</p>
              <p className="mt-1 text-sm text-[#5b6670]">Session {result.session}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ExamResultsSection