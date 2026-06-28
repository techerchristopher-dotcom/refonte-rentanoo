const TESTIMONIALS = [
  {
    text: "Scooter livré à l'aéroport dès mon arrivée, tout était parfait. Je recommande sans hésiter.",
    author: 'Marie T.',
    location: 'Toulouse, France',
    initials: 'MT',
  },
  {
    text: 'Villa avec vue sur le lagon, réservation en 5 minutes, check-in sans stress. Exactement ce qu\'on cherchait.',
    author: 'Julien & Camille',
    location: 'Bordeaux, France',
    initials: 'JC',
  },
  {
    text: "Quad pour explorer l'île, livré à notre hôtel. Le service client répond rapidement sur WhatsApp.",
    author: 'David L.',
    location: 'Lyon, France',
    initials: 'DL',
  },
]

const STATS = [
  { value: '340+', label: 'Avis clients' },
  { value: '4,8/5', label: 'Note moyenne' },
  { value: '< 30 min', label: 'Temps de réponse' },
]

export function HomeTrustSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-16 max-w-2xl mx-auto">
          {STATS.map(stat => (
            <div key={stat.value} className="text-center">
              <div className="font-display font-bold text-3xl text-[#097870] mb-1">{stat.value}</div>
              <div className="font-body text-sm text-[#6B8A8D]">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="font-display font-bold text-2xl text-[#0D1E26] text-center mb-10">
          Ils sont partis sereinement
        </h2>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="border-l-4 border-[#097870] pl-5 py-2">
              <p className="font-body text-[#0D1E26] leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#097870] flex items-center justify-center shrink-0">
                  <span className="font-mono text-xs text-white font-bold">{t.initials}</span>
                </div>
                <div>
                  <div className="font-display font-semibold text-sm text-[#0D1E26]">{t.author}</div>
                  <div className="font-body text-xs text-[#6B8A8D]">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
