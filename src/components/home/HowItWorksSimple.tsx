const STEPS = [
  {
    number: '01',
    title: 'Tu choisis et tu réserves',
    description: 'Sélectionne ton véhicule ou hébergement en ligne, choisis tes dates et valide en quelques clics.',
  },
  {
    number: '02',
    title: 'On livre à ton arrivée',
    description: "Livraison à l'aéroport Fascène, à ton hôtel ou à l'embarcadère barge. Assurance incluse.",
  },
  {
    number: '03',
    title: 'Tu profites sans galère',
    description: 'Assistance 7j/7, annulation flexible, et retour au même endroit. Simple comme bonjour.',
  },
]

export function HowItWorksSimple() {
  return (
    <section className="py-20 px-4 bg-[#F4F2EE]">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0D1E26] text-center mb-4">
          Comment ça marche ?
        </h2>
        <p className="font-body text-[#6B8A8D] text-center mb-16">
          3 étapes, zéro galère.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Ligne de connexion desktop */}
          <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-[#D8D5CF]" />

          {STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#E8622F] flex items-center justify-center mb-6 relative z-10">
                <span className="font-display font-bold text-white text-xl">{step.number}</span>
              </div>
              <h3 className="font-display font-bold text-xl text-[#0D1E26] mb-3">{step.title}</h3>
              <p className="font-body text-[#6B8A8D] leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
