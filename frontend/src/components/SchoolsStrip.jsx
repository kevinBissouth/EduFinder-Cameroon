import Container from './ui/Container'

const STRIP_SIZE = 4

// Bandeau de noms réels : les premiers établissements publiés de l'annuaire
// (les recommandés d'abord, c'est l'ordre fourni par l'API).
function SchoolsStrip({ institutions }) {
  if (institutions.length === 0) return null

  return (
    <section aria-label="Schools listed on EduFinder" className="border-b border-line bg-paper py-12">
      <Container>
        <p className="text-center text-xs font-semibold uppercase tracking-eyebrow text-ink-soft">
          Schools families are comparing on EduFinder
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
          {institutions.slice(0, STRIP_SIZE).map((institution) => (
            <li key={institution.uuid} className="text-center">
              <p className="text-balance font-display text-base leading-snug text-navy sm:text-lg">
                {institution.name}
              </p>
              <p className="mt-1.5 text-xs font-medium uppercase tracking-eyebrow text-ink-soft">
                {institution.city}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

export default SchoolsStrip
