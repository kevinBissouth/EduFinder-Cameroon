// Largeur de lecture et marges latérales communes à toutes les sections.
function Container({ className = '', children }) {
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  )
}

export default Container
