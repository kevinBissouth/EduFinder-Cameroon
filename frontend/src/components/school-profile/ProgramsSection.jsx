// Filières et programmes publiés par l'établissement, affichés en pastilles.
function ProgramsSection({ programs = [] }) {
  if (programs.length === 0) return null

  return (
    <section id="programs" className="scroll-mt-40">
      <h2 className="font-display text-3xl text-[#081220]">Programs &amp; curricula</h2>
      <div className="mt-6 flex flex-wrap gap-3">
        {programs.map((program) => (
          <span
            key={program}
            className="rounded-full border border-[#dcebe3] bg-[#f0f8f4] px-5 py-2.5 text-sm font-semibold text-[#0a5e3d]"
          >
            {program}
          </span>
        ))}
      </div>
    </section>
  )
}

export default ProgramsSection