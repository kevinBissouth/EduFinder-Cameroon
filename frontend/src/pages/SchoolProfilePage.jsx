import { SearchX } from 'lucide-react'

import Footer from '../components/Footer'
import Header from '../components/Header'
import ExamResultsSection from '../components/school-profile/ExamResultsSection'
import FeesSection from '../components/school-profile/FeesSection'
import GallerySection from '../components/school-profile/GallerySection'
import KeyFacts from '../components/school-profile/KeyFacts'
import LeadershipSection from '../components/school-profile/LeadershipSection'
import LocationSection from '../components/school-profile/LocationSection'
import OfferSection from '../components/school-profile/OfferSection'
import OverviewSection from '../components/school-profile/OverviewSection'
import ProfileCta from '../components/school-profile/ProfileCta'
import ProfileHero from '../components/school-profile/ProfileHero'
import QuestionsSection from '../components/school-profile/QuestionsSection'
import SectionNav from '../components/school-profile/SectionNav'
import Container from '../components/ui/Container'
import StateMessage from '../components/ui/StateMessage'
import { useSchoolProfile } from '../hooks/useSchoolProfile'
import { navigateToHome } from '../routes'

const PAGE_CLASSES = 'min-h-screen overflow-x-clip bg-paper font-sans text-ink'

// Onglets de la fiche : seules les sections qui ont un contenu y figurent.
function listSections(institution) {
  const hasOffer = institution.programs.length > 0 || institution.services.length > 0
  return [
    { id: 'overview', label: 'Overview' },
    institution.fees.length > 0 && { id: 'fees', label: 'Fees' },
    institution.exam_results.length > 0 && { id: 'results', label: 'Exam results' },
    hasOffer && { id: 'offer', label: 'Programs and services' },
    institution.media.length > 0 && { id: 'gallery', label: 'Gallery' },
    { id: 'contact', label: 'Location and contact' },
  ].filter(Boolean)
}

function ProfileSkeleton() {
  return (
    <Container className="animate-pulse py-12" aria-busy="true" aria-label="Loading the school profile">
      <div className="h-4 w-48 rounded-full bg-muted" />
      <div className="mt-8 h-12 w-2/3 rounded-control bg-muted" />
      <div className="mt-4 h-5 w-1/3 rounded-control bg-muted" />
      <div className="mt-8 h-24 max-w-xl rounded-control bg-muted" />
      <div className="mt-12 h-20 rounded-panel bg-muted" />
    </Container>
  )
}

function ProfileNotFound() {
  return (
    <Container className="py-16">
      <StateMessage
        icon={SearchX}
        title="This school could not be found"
        description="It may not be published anymore, or the link may be incorrect."
        actionLabel="Back to all schools"
        onAction={navigateToHome}
      />
    </Container>
  )
}

function ProfileContent({ institution }) {
  const coverUrl = institution.media.find((media) => media.type === 'image')?.url ?? null

  return (
    <>
      <ProfileHero institution={institution} coverUrl={coverUrl} />
      <KeyFacts institution={institution} />
      <SectionNav sections={listSections(institution)} />
      <OverviewSection institution={institution} />
      <LeadershipSection institution={institution} />
      <FeesSection fees={institution.fees} />
      <ExamResultsSection examResults={institution.exam_results} />
      <OfferSection programs={institution.programs} services={institution.services} />
      <GallerySection media={institution.media} />
      <LocationSection institution={institution} />
      <QuestionsSection institution={institution} />
      <ProfileCta />
    </>
  )
}

// Fiche publique d'un établissement, alimentée par /institutions/{uuid}.
function SchoolProfilePage({ schoolId }) {
  const { institution, status } = useSchoolProfile(schoolId)

  return (
    <div className={PAGE_CLASSES}>
      <Header />
      <main>
        {status === 'loading' && <ProfileSkeleton />}
        {status === 'error' && <ProfileNotFound />}
        {status === 'success' && institution && <ProfileContent institution={institution} />}
      </main>
      <Footer />
    </div>
  )
}

export default SchoolProfilePage
