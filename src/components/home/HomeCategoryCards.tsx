import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    id: 'vehicules',
    title: 'Véhicules',
    subtitle: 'Scooters, motos, voitures & quads',
    description: 'dès 10 €/jour · Livraison incluse',
    href: '/?cat=scooter#search-results',
    cta: 'Voir les véhicules',
    gradient: 'from-[#097870] to-[#0B1A1F]',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  },
  {
    id: 'hebergements',
    title: 'Hébergements',
    subtitle: 'Villas, bungalows & maisons',
    description: 'dès 22 €/nuit · Vue lagon',
    href: '/?cat=hebergement#search-results',
    cta: 'Voir les hébergements',
    gradient: 'from-[#E8622F] to-[#0B1A1F]',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
  },
]

export function HomeCategoryCards() {
  return (
    <section className="py-20 px-4 bg-[#F4F2EE]" id="vehicules">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0D1E26] text-center mb-4">
          Qu'est-ce que tu cherches ?
        </h2>
        <p className="font-body text-[#6B8A8D] text-center mb-12">
          Toutes nos offres à Nosy Be, disponibles en ligne.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={cat.href}
              id={cat.id === 'hebergements' ? 'hebergements' : undefined}
              className="group relative overflow-hidden rounded-2xl min-h-72 flex flex-col justify-end p-8 transition-transform hover:scale-[1.02]"
            >
              {/* Image */}
              <div
                className="absolute inset-0 bg-center bg-cover transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url('${cat.image}')` }}
              />
              {/* Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient} opacity-80`} />

              {/* Contenu */}
              <div className="relative z-10">
                <p className="font-mono text-xs tracking-widest uppercase text-white/60 mb-2">
                  {cat.description}
                </p>
                <h3 className="font-display font-bold text-3xl text-white mb-1">{cat.title}</h3>
                <p className="font-body text-white/70 mb-4">{cat.subtitle}</p>
                <span className="inline-flex items-center gap-2 font-display font-semibold text-white group-hover:gap-3 transition-all">
                  {cat.cta} <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
