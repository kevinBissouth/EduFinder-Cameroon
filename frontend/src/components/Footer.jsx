import { GradCapIcon } from './icons'

function Footer({ types = [] }) {
  const currentYear = new Date().getFullYear()
  const columns = [
    {
      title: 'Explore',
      links: types.map((type) => type.name),
    },
    {
      title: 'Find',
      links: ['By city', 'By type', 'By language', 'By fees'],
    },
    {
      title: 'Support',
      links: ['How it works', 'Contact us', 'FAQ', 'List your school'],
    },
    {
      title: 'Company',
      links: ['About', 'Terms of service', 'Privacy policy'],
    },
  ]

  return (
    <footer className="bg-[#081220] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_2.2fr] lg:gap-16 lg:px-8">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-gradient-to-br from-[#0d7a4f] to-[#d9a406] p-2 text-white">
              <GradCapIcon />
            </div>
            <span className="font-display text-lg font-bold">EduFinder</span>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#dcebe3]/70">
            Helping families and students across Cameroon find the school that
            matches their needs.
          </p>
          {/* Icônes sociales officielles : couleurs réelles des marques sur
              pastilles blanches pour rester lisibles sur le fond sombre. */}
          <div className="mt-6 flex gap-2.5">
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="X"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="#000000" aria-hidden="true">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
                <defs>
                  <radialGradient id="instagram-gradient" cx="30%" cy="107%" r="150%">
                    <stop offset="0%" stopColor="#fdf497" />
                    <stop offset="5%" stopColor="#fdf497" />
                    <stop offset="45%" stopColor="#fd5949" />
                    <stop offset="60%" stopColor="#d6249f" />
                    <stop offset="90%" stopColor="#285AEB" />
                  </radialGradient>
                </defs>
                <path
                  fill="url(#instagram-gradient)"
                  d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 20.164a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"
                />
              </svg>
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="#FF0000" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f2c14e]">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-3.5 text-sm">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-[#dcebe3]/70 transition-colors hover:text-[#f7f8fc]">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#dcebe3]/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-[#f7f8fc]/80 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>© {currentYear} EduFinder Cameroon</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer