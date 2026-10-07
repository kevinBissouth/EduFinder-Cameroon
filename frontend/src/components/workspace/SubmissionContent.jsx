import { describeSubmissionContent } from './submissionContent'

function ContentValue({ line }) {
  if (!line.items) return <dd className="mt-1 whitespace-pre-line text-sm text-navy">{line.text}</dd>

  return (
    <dd className="mt-1">
      <ul className="space-y-1 text-sm text-navy">
        {line.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </dd>
  )
}

// Ce qu'une soumission propose, ligne par ligne.
function SubmissionContent({ content, meta }) {
  const contentLines = describeSubmissionContent(content, meta)

  if (contentLines.length === 0) {
    return <p className="text-sm text-ink-soft">This submission carries no detail.</p>
  }

  return (
    <dl className="space-y-4">
      {contentLines.map((line) => (
        <div key={line.key}>
          <dt className="text-sm font-semibold text-ink-soft">{line.label}</dt>
          <ContentValue line={line} />
        </div>
      ))}
    </dl>
  )
}

export default SubmissionContent
