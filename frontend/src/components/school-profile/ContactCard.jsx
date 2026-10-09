import { ArrowUpRight, Globe, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import Button from '../ui/Button'
import { buildContactHref, toExternalUrl, toWhatsAppUrl } from './helpers'
import { trackInstitutionEvent } from '../../utils/tracking'

const CONTACT_LINK_CLASSES =
  'flex min-h-11 items-center gap-3 rounded-control text-sm text-ink transition-colors hover:text-primary-deep'

// Coordonnées publiées par l'établissement. Une ligne absente n'est pas
// affichée ; si rien n'est publié, la carte le dit.
function ContactCard({ institution }) {
  const { t } = useTranslation('profile')
  const websiteUrl = toExternalUrl(institution.website)
  const contactHref = buildContactHref(institution)
  const whatsAppUrl = toWhatsAppUrl(institution.phone)
  // Téléphone, e-mail et demande de renseignements comptent comme une prise
  // de contact ; le lien vers le site, lui, n'en est pas une.
  const trackInquiry = () => trackInstitutionEvent(institution.uuid, 'inquiry')
  const hasAnyContact =
    websiteUrl || institution.phone || institution.contact_email || institution.address

  return (
    <div className="rounded-panel border border-line bg-surface p-6 shadow-soft">
      <h3 className="text-lg font-bold text-navy">{t('contact.title')}</h3>
      {!hasAnyContact && (
        <p className="mt-3 text-sm text-ink-soft">{t('contact.none')}</p>
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
        {whatsAppUrl && (
          <li>
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackInquiry}
              className={CONTACT_LINK_CLASSES}
            >
              <MessageCircle aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
              {t('contact.whatsapp')}
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
      {/* Sur téléphone le site figure déjà dans la liste au-dessus : son
          bouton s'efface et la demande prend toute la largeur. */}
      <div className="mt-4 flex flex-wrap gap-3">
        {contactHref && (
          <Button as="a" href={contactHref} onClick={trackInquiry} className="max-sm:w-full">
            {t('contact.sendEnquiry')}
          </Button>
        )}
        {websiteUrl && (
          <Button
            as="a"
            href={websiteUrl}
            variant="secondary"
            className="max-sm:hidden"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('hero.visitWebsite')}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

export default ContactCard
