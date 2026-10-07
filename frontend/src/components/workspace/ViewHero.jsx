// Bandeau d'ouverture d'une vue : son titre, une phrase de bilan, des
// chiffres en pastilles et l'action principale, sur le dégradé bleu → violet.
function ViewHero({ title, description, figures = [], action }) {
  return (
    <section className="mb-6 flex flex-col gap-5 rounded-panel bg-linear-to-br from-primary-deep to-violet-deep p-6 text-white shadow-glow [--focus-ring:var(--color-accent)] sm:flex-row sm:items-center sm:justify-between sm:p-8">
      <div className="min-w-0">
        <h2 className="font-display text-3xl leading-display">{title}</h2>
        <p className="mt-2 text-sm text-white text-pretty">{description}</p>
        {figures.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {figures.map((figure) => (
              <li
                key={figure.label}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold tabular-nums"
              >
                {figure.value} {figure.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {action}
    </section>
  )
}

export default ViewHero
