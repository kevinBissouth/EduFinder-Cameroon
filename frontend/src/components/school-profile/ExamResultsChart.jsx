import { useEffect, useState } from 'react'

import { useInView } from '../../hooks/useInView'

// Palette de courbes, dans la charte vert/doré + accents vifs pour rester lisible.
const PALETTE = ['#0d7a4f', '#d9a406', '#0e7490', '#7c3aed', '#0ea5e9', '#db2777', '#65a30d', '#ea580c']

// Convertit une liste de points [x, y] en chemin SVG lissé (Catmull-Rom -> Bézier)
// pour un rendu organique plutôt que des segments anguleux.
function smoothPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`
  let path = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return path
}

// Graphe cartésien d'évolution des taux de réussite par session : axes X (session)
// et Y (taux %), une courbe lissée par examen, historique non écrasé. SVG natif.
function ExamResultsChart({ examResults = [] }) {
  const [wrapRef, inView] = useInView(0.15)
  const [drawn, setDrawn] = useState(false)
  const [hovered, setHovered] = useState(null)
  useEffect(() => {
    if (inView) setDrawn(true)
  }, [inView])

  const sessions = [...new Set(examResults.map((result) => result.session))].sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return String(a).localeCompare(String(b))
  })

  const byExam = {}
  for (const result of examResults) {
    ;(byExam[result.exam] ||= []).push(result)
  }
  const series = Object.keys(byExam).map((exam, index) => ({
    exam,
    color: PALETTE[index % PALETTE.length],
    points: byExam[exam]
      .slice()
      .sort((a, b) => sessions.indexOf(a.session) - sessions.indexOf(b.session))
      .map((result) => ({ session: result.session, rate: Number(result.pass_rate) })),
  }))

  if (sessions.length === 0) return null

  const W = 780
  const H = 400
  const PL = 54
  const PR = 20
  const PT = 24
  const PB = 56
  const iw = W - PL - PR
  const ih = H - PT - PB
  const xAt = (i) => PL + (sessions.length === 1 ? iw / 2 : (iw * i) / (sessions.length - 1))
  const yAt = (value) => PT + ih * (1 - value / 100)
  const baseY = yAt(0)
  const gridValues = [0, 20, 40, 60, 80, 100]

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-2xl border border-[#e7ece9] bg-gradient-to-b from-white to-[#f4faf6] p-5 shadow-[0_10px_34px_rgba(13,122,79,0.10)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Exam pass rate by session">
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.exam} id={`area-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0d7a4f" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Grille horizontale + étiquettes Y */}
        {gridValues.map((value) => (
          <g key={value}>
            <line x1={PL} y1={yAt(value)} x2={W - PR} y2={yAt(value)} stroke="#eaf0ed" strokeWidth="1" />
            <text x={PL - 10} y={yAt(value) + 4} textAnchor="end" className="fill-[#8a90a0] text-[11px]">
              {value}
            </text>
          </g>
        ))}

        {/* Axes X et Y */}
        <line x1={PL} y1={PT} x2={PL} y2={baseY} stroke="#94a3b8" strokeWidth="1.5" />
        <line x1={PL} y1={baseY} x2={W - PR} y2={baseY} stroke="#94a3b8" strokeWidth="1.5" />

        {/* Graduations + étiquettes de session (axe X) */}
        {sessions.map((session, i) => (
          <g key={session}>
            <line x1={xAt(i)} y1={baseY} x2={xAt(i)} y2={baseY + 5} stroke="#94a3b8" strokeWidth="1.5" />
            <text x={xAt(i)} y={baseY + 20} textAnchor="middle" className="fill-[#5b6670] text-[11px]">
              {session}
            </text>
          </g>
        ))}

        {/* Titres d'axes */}
        <text x={PL + iw / 2} y={H - 8} textAnchor="middle" className="fill-[#5b6670] text-[12px] font-semibold">
          Session
        </text>
        <text
          x={16}
          y={PT + ih / 2}
          textAnchor="middle"
          className="fill-[#5b6670] text-[12px] font-semibold"
          transform={`rotate(-90 16 ${PT + ih / 2})`}
        >
          Pass rate (%)
        </text>

        {/* Aires + courbes lissées */}
        {series.map((s, si) => {
          const pts = s.points.map((p, i) => [xAt(i), yAt(p.rate)])
          const linePath = smoothPath(pts)
          const areaPath = `${linePath} L ${pts[pts.length - 1][0].toFixed(1)} ${baseY} L ${pts[0][0].toFixed(1)} ${baseY} Z`
          return (
            <g key={s.exam}>
              <path d={areaPath} fill={`url(#area-${si})`} stroke="none" />
              <path
                d={linePath}
                fill="none"
                stroke={s.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset={drawn ? 0 : 1}
                style={{ transition: 'stroke-dashoffset 1.3s ease-out' }}
                filter="url(#lineGlow)"
              />
              {s.points.map((p, i) => {
                const isActive = hovered && hovered.si === si && hovered.pi === i
                return (
                  <circle
                    key={p.session}
                    cx={xAt(i)}
                    cy={yAt(p.rate)}
                    r={isActive ? 6.5 : 4.5}
                    fill="#fff"
                    stroke={s.color}
                    strokeWidth="2.5"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHovered({ si, pi: i })}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <title>{`${s.exam} · ${p.session} : ${p.rate}%`}</title>
                  </circle>
                )
              })}
            </g>
          )
        })}
      </svg>

      {/* Infobulle au survol */}
      {hovered && (() => {
        const s = series[hovered.si]
        const p = s.points[hovered.pi]
        const left = (xAt(hovered.pi) / W) * 100
        const top = (yAt(p.rate) / H) * 100
        return (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] rounded-xl bg-[#081220] px-3 py-2 text-center shadow-lg"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: s.color }}>
              {s.exam}
            </p>
            <p className="text-sm font-bold text-white">{p.rate}%</p>
            <p className="text-[10px] text-white/60">Session {p.session}</p>
          </div>
        )
      })()}

      {/* Légende */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {series.map((s) => (
          <div key={s.exam} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
            <span className="text-[12px] font-medium text-[#343a44]">{s.exam}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ExamResultsChart
