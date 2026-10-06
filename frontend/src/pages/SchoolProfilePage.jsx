import { API_URL } from '../constants'
import { AlertIcon } from '../components/icons'
import { useSchoolProfile } from '../hooks/useSchoolProfile'
import useFiltersMeta from '../hooks/useFiltersMeta'
import ProfileCover from '../components/school-profile/ProfileCover'
import LeadershipSection from '../components/school-profile/LeadershipSection'
import OverviewSection from '../components/school-profile/OverviewSection'
import FeesSection from '../components/school-profile/FeesSection'
import ProgramsSection from '../components/school-profile/ProgramsSection'
import ServicesSection from '../components/school-profile/ServicesSection'
import ExamResultsSection from '../components/school-profile/ExamResultsSection'
import ContactSection from '../components/school-profile/ContactSection'
import InterestCta from '../components/school-profile/InterestCta'
import QuickFactsSidebar from '../components/school-profile/QuickFactsSidebar'
import GallerySection from '../components/school-profile/GallerySection'
import Header from '../components/Header'
import Footer from '../components/Footer'

// Fiche publique d'un établissement : composition des sections du dossier
// school-profile/, alimentées par le détail renvoyé par /institutions/{uuid}.
function SchoolProfilePage({ schoolId }) {
  const { institution, status } = useSchoolProfile(schoolId)
  const { meta } = useFiltersMeta()

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f6faf8]">
        <Header />
        <p className="py-24 text-center text-sm text-[#8a90a0]">
          Loading establishment profile…
        </p>
        <Footer types={meta.types} />
      </div>
    )
  }

  if (status === 'error' || !institution) {
    return (
      <div className="min-h-screen bg-[#f6faf8]">
        <Header />
        <div className="mx-auto max-w-[1390px] px-4 py-16 sm:px-6 lg:px-[70px]">
          <div className="rounded-2xl border border-[#fecaca] bg-white p-12 text-center">
            <AlertIcon className="mx-auto h-14 w-14 text-[#dc2626]" />
            <h2 className="mt-4 font-display text-2xl text-[#081220]">
              Establishment not found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#4b5566]">
              We couldn't find this establishment. It may not be published
              anymore, or the link is incorrect.
            </p>
            <a
              href="#/"
              className="mt-6 inline-flex items-center rounded-xl bg-gradient-to-r from-[#0d7a4f] to-[#0a5e3d] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            >
              Back to search
            </a>
          </div>
        </div>
        <Footer types={meta.types} />
      </div>
    )
  }

  const locationText = [institution.city, institution.region].filter(Boolean).join(' · ')
  const imageMedia = (institution.media || []).filter(
    (mediaItem) => mediaItem.type === 'image',
  )
  // L'emblème et la couverture reprennent la première photo publiée : il
  // n'existe pas de logo dédié en base, on ne fabrique pas de ressource.
  const logoUrl = imageMedia.length > 0 ? `${API_URL}${imageMedia[0].url}` : null
  const coverUrl = imageMedia.length > 0 ? `${API_URL}${imageMedia[0].url}` : null
  const minFee = institution.fees?.length
    ? Math.min(...institution.fees.map((fee) => Number(fee.amount)))
    : null

  return (
    <div className="min-h-screen bg-[#f6faf8]">
      <Header
        types={meta.types}
        featuredTypeIds={meta.featured_type_ids}
      />

      <ProfileCover
        name={institution.name}
        type={institution.type}
        sector={institution.sector}
        linguisticSection={institution.linguistic_section}
        phone={institution.phone}
        website={institution.website}
        logoUrl={logoUrl}
        coverUrl={coverUrl}
      />

      <main className="mx-auto max-w-[1390px] px-4 py-12 sm:px-6 lg:px-[70px]">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-12">
            <LeadershipSection
              directorName={institution.director_name}
              directorTitle={institution.director_title}
              directorBio={institution.director_bio}
              directorPhotoUrl={institution.director_photo_url}
            />
            <OverviewSection description={institution.description} />
            <ProgramsSection programs={institution.programs || []} />
            <FeesSection fees={institution.fees || []} />
            <ExamResultsSection examResults={institution.exam_results || []} />
            <ServicesSection services={institution.services || []} />
            <GallerySection media={institution.media || []} />
            <ContactSection
              address={institution.address}
              phone={institution.phone}
              contactEmail={institution.contact_email}
              website={institution.website}
            />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <QuickFactsSidebar
              type={institution.type}
              sector={institution.sector}
              linguisticSection={institution.linguistic_section}
              locationText={locationText}
              minFee={minFee}
              programCount={institution.programs?.length ?? 0}
              serviceCount={institution.services?.length ?? 0}
              photoCount={imageMedia.length}
            />
            <InterestCta
              name={institution.name}
              phone={institution.phone}
              contactEmail={institution.contact_email}
            />
          </aside>
        </div>
      </main>

      <Footer types={meta.types} />
    </div>
  )
}

export default SchoolProfilePage