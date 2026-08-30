import { useState } from 'react'

import { ChevronDownIcon } from '../icons'

// Description de l'établissement avec repli « Read more » au-delà de 260 caractères.
function OverviewSection({ description }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <section id="overview" className="scroll-mt-40">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0d7a4f]">
        Presentation
      </p>
      <h2 className="mt-2 font-display text-3xl text-[#081220]">About the institution</h2>
      {description && (
        <>
          <p
            className={`mt-6 max-w-3xl whitespace-pre-line text-[17px] leading-[2] text-[#3a4250] ${
              !isExpanded ? 'line-clamp-3' : ''
            }`}
          >
            {description}
          </p>
          {description.length > 260 && (
            <button
              onClick={() => setIsExpanded((value) => !value)}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0d7a4f] transition-colors hover:text-[#0a5e3d]"
            >
              {isExpanded ? 'Show less' : 'Read more'}
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </>
      )}
    </section>
  )
}

export default OverviewSection
