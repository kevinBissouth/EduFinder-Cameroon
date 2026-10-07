import { LogOut, Mail, ShieldCheck, UserRound } from 'lucide-react'

import Button from '../ui/Button'
import Panel from './Panel'
import { buildInitials } from '../../utils/format'

function SignOutButton({ onSignOut, className = '' }) {
  return (
    <Button
      variant="secondary"
      // Les « ! » font passer le rouge devant les couleurs de la variante.
      className={`border-danger! text-danger-deep! hover:bg-danger-soft! ${className}`}
      onClick={onSignOut}
    >
      <LogOut aria-hidden="true" className="size-4" />
      Sign out
    </Button>
  )
}

// Carte d'identité du compte : un bandeau en dégradé, la pastille aux
// initiales à cheval dessus, puis le nom, le rôle et l'e-mail.
function ProfileCard({ profile, roleLabel, onSignOut }) {
  return (
    <section className="overflow-hidden rounded-panel border border-line bg-surface shadow-soft">
      <div aria-hidden="true" className="h-28 bg-linear-to-br from-primary-deep to-violet-deep" />
      <div className="-mt-12 flex flex-col items-center gap-4 px-6 pb-6 text-center sm:flex-row sm:items-start sm:gap-6 sm:text-left">
        <span
          aria-hidden="true"
          className="flex size-24 shrink-0 items-center justify-center rounded-full border-4 border-surface bg-linear-to-br from-primary to-violet-deep font-display text-3xl text-white shadow-raised"
        >
          {buildInitials(profile.name)}
        </span>
        {/* À côté de la pastille, le nom commence sous le bandeau, jamais dessus. */}
        <div className="min-w-0 flex-1 sm:mt-14">
          <h2 className="font-display text-3xl leading-display text-navy text-balance">
            {profile.name}
          </h2>
          <p className="mt-2 inline-block rounded-full bg-violet-soft px-3 py-1 text-xs font-semibold text-violet-deep">
            {roleLabel}
          </p>
          <p className="mt-3 flex items-center justify-center gap-2 break-all text-sm text-ink sm:justify-start">
            <Mail aria-hidden="true" className="size-4 shrink-0 text-primary" />
            {profile.email}
          </p>
        </div>
        {/* À partir de la tablette, la déconnexion est dans la carte ; sur
            téléphone elle est tout en bas de la vue. */}
        <div className="hidden sm:mt-14 sm:block">
          <SignOutButton onSignOut={onSignOut} />
        </div>
      </div>
    </section>
  )
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-soft text-primary-deep">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-ink-soft">{label}</dt>
        <dd className="break-words text-base font-semibold text-navy">{value}</dd>
      </div>
    </div>
  )
}

// Vue « Account » des deux espaces : qui est connecté et les informations de
// son compte, suivies des lignes propres à l'espace (extraDetails). Rien ne
// s'y modifie : les comptes sont créés et tenus à jour hors de l'application.
function AccountView({ profile, roleLabel, changeHint, extraDetails = [], onSignOut }) {
  return (
    <div className="space-y-6">
      <ProfileCard profile={profile} roleLabel={roleLabel} onSignOut={onSignOut} />
      <Panel
        icon={UserRound}
        tone="blue"
        title="Account details"
        description={changeHint}
      >
        <dl className="divide-y divide-line">
          <DetailRow icon={UserRound} label="Full name" value={profile.name} />
          <DetailRow icon={Mail} label="Email" value={profile.email} />
          <DetailRow icon={ShieldCheck} label="Role" value={roleLabel} />
          {extraDetails.map((detail) => (
            <DetailRow key={detail.label} {...detail} />
          ))}
        </dl>
      </Panel>
      {/* Sur téléphone, la déconnexion ferme la vue : un bouton pleine largeur,
          séparé du reste, loin des informations du compte. */}
      <div className="sm:hidden">
        <SignOutButton onSignOut={onSignOut} className="w-full" />
      </div>
    </div>
  )
}

export default AccountView
