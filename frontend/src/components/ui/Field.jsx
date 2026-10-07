import { ChevronDown } from 'lucide-react'

export const CONTROL_CLASSES =
  'h-11 w-full rounded-control border border-line bg-surface px-3 text-sm font-medium text-navy transition-colors placeholder:font-normal placeholder:text-ink-soft hover:border-primary'

function FieldLabel({ children }) {
  return <span className="text-sm font-semibold text-navy">{children}</span>
}

export function TextField({ label, className = '', ...inputProps }) {
  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <input {...inputProps} className={CONTROL_CLASSES} />
    </label>
  )
}

export function SelectField({ label, placeholder, options, className = '', ...selectProps }) {
  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <span className="relative">
        <select {...selectProps} className={`${CONTROL_CLASSES} appearance-none pr-9`}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
        />
      </span>
    </label>
  )
}

export function TextAreaField({ label, className = '', ...textAreaProps }) {
  return (
    <label className={`flex w-full flex-col gap-1.5 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      <textarea {...textAreaProps} className={`${CONTROL_CLASSES} h-auto py-2.5`} />
    </label>
  )
}
