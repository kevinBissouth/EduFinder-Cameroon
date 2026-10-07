import { ArrowUpRight, Globe, Mail, MapPin, Phone } from 'lucide-react'

import Button from '../ui/Button'
import { buildContactHref, toExternalUrl } from './helpers'
import { trackInstitutionEvent } from '../../utils/tracking'

const CONTACT_LINK_CLASSES =
  'flex min-h-11 items-center gap-3 rounded-control text-sm text-ink transition-colors hover:text-primary-deep'

// Coordonnées publiées par l'établissement. Une ligne absente n'est pas
// affichée ; si rien n'est publié, la carte le dit.
function ContactCard({ institution }) {
  const websiteUrl = toExternalUrl(institution.website)
  const contactHref = buildContactHref(institution)
  // Téléphone, e-mail et demande de renseignements comptent comme une prise
  // de contact ; le lien vers le site, lui, n'en est pas une.
  const trackInquiry = () => trackInstitutionEvent(institution.uuid, 'inquiry')
  const hasAnyContact =
    websiteUrl || institution.phone || institution.contact_email || institution.address

  return (
    <div className="rounded-panel border border-line bg-surface p-6 shadow-soft">
      <h3 className="text-lg font-bold text-navy">Contact the school</h3>
      {!hasAnyContact && (
        <p className="mt-3 text-sm text-ink-soft">This school has not published its contacts yet.</p>
      )}
      <ul className="mt-2">
        {websiteUrl && (
          <li>
            <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className={CONTACT_LINK_CLASSES}>
              <Globe aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              <span className="break-all">{institution.website}</span>
            </a>
          </li>
        )}
        {institution.phone && (
          <li>
            <a
              href={`tel:${institution.phone}`}
              onClick={trackInquiry}
              className={CONTACT_LINK_CLASSES}
            >
              <Phone aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              {institution.phone}
            </a>
          </li>
        )}
        {institution.contact_email && (
          <li>
            <a
              href={`mailto:${institution.contact_email}`}
              onClick={trackInquiry}
              className={CONTACT_LINK_CLASSES}
            >
              <Mail aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              <span className="break-all">{institution.contact_email}</span>
            </a>
          </li>
        )}
        {institution.address && (
          <li className="flex min-h-11 items-center gap-3 text-sm text-ink">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
            {institution.address}, {institution.city}
          </li>
        )}
      </ul>
      <div className="mt-4 flex flex-wrap gap-3">
        {websiteUrl && (
          <Button as="a" href={websiteUrl} target="_blank" rel="noopener noreferrer">
            Visit website
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        )}
        {contactHref && (
          <Button as="a" href={contactHref} variant="secondary" onClick={trackInquiry}>
            Send an enquiry
          </Button>
        )}
      </div>
    </div>
  )
}

export default ContactCard
