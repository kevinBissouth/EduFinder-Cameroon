import { useId } from 'react'

import { formatAmount } from '../../utils/format'

const CONTROL_BASE_CLASSES =
  'h-11 w-full rounded-control border bg-surface px-3 text-sm font-medium text-navy transition-colors placeholder:font-normal placeholder:text-ink-soft'
const CONTROL_STATE_CLASSES = {
  valid: 'border-line hover:border-primary',
  invalid: 'border-danger',
}

function controlClasses(error) {
  return `${CONTROL_BASE_CLASSES} ${error ? CONTROL_STATE_CLASSES.invalid : CONTROL_STATE_CLASSES.valid}`
}

// Le message est relié au champ (aria-describedby) : un lecteur d'écran le lit
// en même temps que le libellé, pas seulement la couleur rouge.
function useFieldError(error) {
  const errorId = useId()
  const controlProps = error ? { 'aria-invalid': true, 'aria-describedby': errorId } : {}
  const errorMessage = error && (
    <span id={errorId} className="text-sm font-medium text-danger-deep">
      {error}
    </span>
  )
  return { controlProps, errorMessage }
}

function FieldLabel({ children }) {
  return <span className="text-sm font-semibold text-navy">{children}</span>
}

export function TextField({ label, error, className = '', ...inputProps }) {
  const { controlProps, errorMessage } = useFieldError(error)

  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input {...inputProps} {...controlProps} className={controlClasses(error)} />
      {errorMessage}
    </label>
  )
}

const NON_DIGITS = /\D/g

// Montant entier, affiché avec le séparateur de milliers de la langue. Un
// champ numérique du navigateur ne sait pas l'afficher : c'est donc un champ
// texte, qui ne retient que les chiffres et rend au parent la valeur brute.
export function AmountField({ value, onChange, ...fieldProps }) {
  const digits = String(value ?? '').replace(NON_DIGITS, '')

  return (
    <TextField
      {...fieldProps}
      type="text"
      inputMode="numeric"
      value={digits ? formatAmount(digits) : ''}
      onChange={(event) => onChange(event.target.value.replace(NON_DIGITS, ''))}
    />
  )
}

const PHONE_FORBIDDEN_CHARACTERS = /[^\d +]/g
const PLUS_AFTER_FIRST_CHARACTER = /(?!^)\+/g

// Numéro de téléphone : les lettres ne s'affichent même pas. Je garde les
// chiffres, les espaces, et un « + » seulement en tête (l'indicatif).
export function PhoneField({ onChange, ...fieldProps }) {
  const keepPhoneCharacters = (typedText) =>
    typedText.replace(PHONE_FORBIDDEN_CHARACTERS, '').replace(PLUS_AFTER_FIRST_CHARACTER, '')

  return (
    <TextField
      {...fieldProps}
      type="tel"
      inputMode="tel"
      onChange={(event) => onChange(keepPhoneCharacters(event.target.value))}
    />
  )
}

export function TextAreaField({ label, error, className = '', ...textAreaProps }) {
  const { controlProps, errorMessage } = useFieldError(error)

  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <textarea {...textAreaProps} {...controlProps} className={`${controlClasses(error)} h-auto py-2.5`} />
      {errorMessage}
    </label>
  )
}
