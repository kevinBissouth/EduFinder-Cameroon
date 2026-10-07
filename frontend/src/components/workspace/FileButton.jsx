// Bouton de choix de fichier : le champ natif reste dans la page (donc
// atteignable au clavier) mais c'est le libellé qui se voit.
function FileButton({ accept, disabled, onSelectFile, children }) {
  const handleChange = (event) => {
    const [selectedFile] = event.target.files
    if (selectedFile) onSelectFile(selectedFile)
    // Sans cette remise à zéro, choisir deux fois le même fichier ne déclenche rien.
    event.target.value = ''
  }

  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-button border border-line bg-surface px-5 text-sm font-semibold text-navy transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:border-primary hover:text-primary-deep">
      {children}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  )
}

export default FileButton
