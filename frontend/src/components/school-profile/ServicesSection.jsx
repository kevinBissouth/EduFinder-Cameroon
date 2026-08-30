import {
  ActivityIcon,
  BedDoubleIcon,
  BookOpenIcon,
  BusIcon,
  FlaskConicalIcon,
  GradCapIcon,
  UtensilsIcon,
  WrenchIcon,
} from '../icons'
import { SHADOW_1, SHADOW_SOFT } from './helpers'

// Icône de service déduite du libellé publié.
function ServiceIcon({ name }) {
  const key = name.toLowerCase()
  let Icon = GradCapIcon
  if (/biblioth|library/.test(key)) Icon = BookOpenIcon
  else if (/cantin|restaur|canteen/.test(key)) Icon = UtensilsIcon
  else if (/internat|board|foyer|héberg/.test(key)) Icon = BedDoubleIcon
  else if (/labor|labo|science|santé|health|hôpit/.test(key)) Icon = FlaskConicalIcon
  else if (/sport/.test(key)) Icon = ActivityIcon
  else if (/bus|transport/.test(key)) Icon = BusIcon
  else if (/atelier|workshop/.test(key)) Icon = WrenchIcon

  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#0d7a4f]/10 text-[#0d7a4f]">
      <Icon className="h-7 w-7" />
    </div>
  )
}

function ServicesSection({ services = [] }) {
  return (
    <section id="services" className="scroll-mt-40">
      <h2 className="font-display text-3xl text-[#081220]">Facilities &amp; infrastructure</h2>
      {services.length === 0 ? (
        <p className="mt-6 text-sm text-[#98a2ac]">No service published yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.name}
              className={`relative flex flex-col items-center gap-3 rounded-2xl border border-[#e7ece9] bg-white p-6 text-center transition-shadow duration-300 ${SHADOW_SOFT} hover:${SHADOW_1}`}
            >
              <ServiceIcon name={service.name} />
              <p className="text-sm font-semibold text-[#081220]">{service.name}</p>
              {service.description && (
                <p className="-mt-2 text-xs leading-relaxed text-[#98a2ac]">
                  {service.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default ServicesSection
