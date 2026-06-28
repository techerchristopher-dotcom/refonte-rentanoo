export function HomeHero() {
  return (
    <section className="relative min-h-screen flex items-center bg-[#0B1A1F] overflow-hidden">
      {/* Image de fond */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?w=1920&q=80')",
        }}
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1A1F]/60 via-[#0B1A1F]/40 to-[#0B1A1F]" />

      {/* Contenu hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        {/* Eyebrow */}
        <p className="font-mono text-sm text-[#0FBFB0]/70 tracking-widest uppercase mb-6 animate-fade-up">
          Location · Nosy Be, Madagascar
        </p>

        {/* H1 */}
        <h1
          className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl text-white leading-tight mb-6 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          Réserve ton<br />
          <span className="text-[#0FBFB0]">scooter.</span><br />
          Pose tes<br />
          valises.
        </h1>

        {/* Sous-titre */}
        <p
          className="font-body text-lg md:text-xl text-white/70 max-w-2xl mb-8 animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          Véhicules et hébergements livrés à l'aéroport Fascène ou à ton hôtel.
          Assurance incluse. 100% en ligne.
        </p>

        {/* Trust strip */}
        <div
          className="flex flex-wrap gap-4 mb-10 animate-fade-up"
          style={{ animationDelay: '0.3s' }}
        >
          {['✓ Livraison aéroport', '✓ Assurance comprise', '✓ Annulation flexible'].map(item => (
            <span key={item} className="font-body text-sm text-white/60 flex items-center gap-1">
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
