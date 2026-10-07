// Chaque tuile a sa couleur pleine ; le texte posé dessus garde un contraste
// AA (blanc sur les teintes sombres, bleu nuit sur l'ambre).
const TONE_CLASSES = {
  blue: 'bg-primary text-white',
  amber: 'bg-accent text-navy',
  green: 'bg-success text-white',
  violet: 'bg-violet-deep text-white',
  red: 'bg-danger-deep text-white',
  navy: 'bg-navy text-white',
  // Harmonie unique bleu → violet : trois dégradés de la même famille, pour
  // un tableau de bord qui ne veut pas une couleur par carte.
  harmonyBlue: 'bg-linear-to-br from-primary to-primary-deep text-white',
  harmonyBlend: 'bg-linear-to-br from-primary-deep to-violet-deep text-white',
  harmonyViolet: 'bg-linear-to-br from-violet-deep to-primary text-white',
  harmonyBright: 'bg-linear-to-br from-primary to-violet-deep text-white',
}

const TILE_CLASSES =
  'flex min-h-32 w-full min-w-0 flex-col justify-between gap-3 rounded-panel p-4 text-left shadow-soft [--focus-ring:var(--color-navy)] sm:p-5'

function TileContent({ icon: Icon, label, value }) {
  return (
    <>
      {/* Sur un écran étroit le pictogramme passe au-dessus du libellé : côte à
          côte, un mot long comme « Submissions » ne tiendrait pas. */}
      <span className="flex flex-col-reverse items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
        <span className="min-w-0 text-sm font-semibold text-pretty">{label}</span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </span>
      <span className="font-display text-5xl leading-display tabular-nums">{value}</span>
    </>
  )
}

// Une tuile qui mène quelque part est un bouton ; sinon c'est un simple bloc.
function StatTile({ icon, label, value, tone, onOpen }) {
  const content = <TileContent icon={icon} label={label} value={value} />
  if (!onOpen) return <div className={`${TILE_CLASSES} ${TONE_CLASSES[tone]}`}>{content}</div>

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${TILE_CLASSES} cursor-pointer transition-transform hover:-translate-y-0.5 ${TONE_CLASSES[tone]}`}
    >
      {content}
    </button>
  )
}

const WIDE_GRID_CLASSES = { 3: 'lg:grid-cols-3', 4: 'xl:grid-cols-4' }

// Rangée de chiffres clés : des tuiles de même hauteur, sur deux colonnes
// quand l'écran est étroit. Avec un nombre impair de tuiles, la dernière
// prend alors toute la largeur plutôt que de laisser une case vide.
function StatTiles({ tiles }) {
  const hasLonelyLastTile = tiles.length % 2 === 1

  return (
    <section
      aria-label="Key figures"
      className={`grid grid-cols-2 gap-4 ${WIDE_GRID_CLASSES[tiles.length]} ${
        hasLonelyLastTile ? 'max-lg:*:last:col-span-2' : ''
      }`}
    >
      {tiles.map((tile) => (
        <StatTile key={tile.label} {...tile} />
      ))}
    </section>
  )
}

export default StatTiles
