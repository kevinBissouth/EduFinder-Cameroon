const TILE_COUNT = 3

// Silhouette du tableau de bord pendant le chargement : la page prend sa
// forme tout de suite, au lieu d'afficher une phrase au milieu du vide.
function WorkspaceSkeleton({ label }) {
  return (
    <div role="status" aria-busy="true" className="animate-pulse space-y-6">
      <span className="sr-only">{label}</span>
      <div className="h-44 rounded-panel bg-muted" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: TILE_COUNT }, (_, tileIndex) => (
          <div key={tileIndex} className="h-32 rounded-panel bg-muted last:col-span-2 lg:last:col-span-1" />
        ))}
      </div>
      <div className="h-80 rounded-panel bg-muted" />
    </div>
  )
}

export default WorkspaceSkeleton
