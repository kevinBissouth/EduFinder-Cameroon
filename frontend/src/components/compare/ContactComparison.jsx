import { ArrowRight, Globe, Mail, MessageCircle, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ComparisonSection, SchoolColumns } from './comparisonParts'
import { COMPARISON_SECTION_IDS } from './comparisonLayout'
import Button from '../ui/Button'
import { buildContactLinks } from '../../utils/comparisonView'
import { buildSchoolPath } from '../../routes'

const EXTERNAL_LINK_PROPS = { target: '_blank', rel: 'noopener noreferrer' }

function ContactLine({ icon: Icon, label, text, href, linkProps }) {
  const { t } = useTranslation('compare')

  return (
    <li className="flex min-h-11 items-center gap-2.5 text-sm">
      <Icon aria-hidden="true" className="size-4 shrink-0 text-ink-soft" />
      <span className="sr-only">{label}</span>
      {!text && <span className="text-ink-soft">{t('notPublished')}</span>}
      {text && !href && <span className="wrap-anywhere text-navy">{text}</span>}
      {text && href && (
        <a
          href={href}
          {...linkProps}
          className="wrap-anywhere inline-flex min-h-11 items-center rounded-control font-semibold text-primary-deep underline-offset-2 hover:underline"
        >
          {text}
        </a>
      )}
    </li>
  )
}

function SchoolContact({ school }) {
  const { t } = useTranslation('compare')
  const contactLinks = buildContactLinks(school)

  return (
    <>
      <ul className="space-y-1">
        <ContactLine icon={Phone} label={t('rows.phone')} text={school.phone} href={contactLinks.phoneHref} />
        <ContactLine
          icon={Mail}
          label={t('rows.email')}
          text={school.contact_email}
          href={contactLinks.emailHref}
        />
        <ContactLine
          icon={Globe}
          label={t('rows.website')}
          text={school.website}
          href={contactLinks.websiteHref}
          linkProps={EXTERNAL_LINK_PROPS}
        />
      </ul>
      <div className="mt-auto pt-5">
        <Button as="a" href={buildSchoolPath(school.uuid, school.name)} variant="secondary" className="w-full">
          {t('viewProfile')}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </>
  )
}

function ContactComparison({ schools }) {
  const { t } = useTranslation('compare')

  return (
    <ComparisonSection id={COMPARISON_SECTION_IDS.contact} icon={MessageCircle} title={t('groups.contact')}>
      <SchoolColumns schools={schools} renderSchool={(school) => <SchoolContact school={school} />} />
    </ComparisonSection>
  )
}

export default ContactComparison
