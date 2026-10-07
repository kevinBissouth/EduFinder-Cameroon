import { ResponsiveContainer } from 'recharts'

// Cadre d'un graphique dans un bloc de hauteur fixe : il prend toute la place
// laissée libre. Le graphique est posé en absolu dedans, car un simple
// pourcentage de hauteur dans une boîte flexible n'est pas toujours résolu au
// premier calcul, et le graphique ne se dessinait alors pas du tout.
function ChartFrame({ children }) {
  return (
    <div className="relative min-h-40 flex-1">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartFrame
