import { Link } from 'react-router-dom'

const LINKS = {
  vehicules: [
    { label: 'Scooters', href: '/location-scooter-nosy-be' },
    { label: 'Motos', href: '/location-moto-nosy-be' },
    { label: 'Voitures', href: '/location-voiture-nosy-be' },
    { label: 'Quads & Buggies', href: '/location-quad-nosy-be' },
  ],
  hebergements: [
    { label: 'Villas', href: '/location-villa-nosy-be' },
    { label: 'Bungalows', href: '/location-bungalow-nosy-be' },
    { label: 'Appartements', href: '/location-appartement-nosy-be' },
    { label: 'Hébergements', href: '/location-hebergement-nosy-be' },
  ],
  rentanoo: [
    { label: 'Devenir opérateur', href: '/rent-my-car' },
    { label: 'Blog', href: '/blog' },
    { label: 'Contact', href: '/contact' },
    { label: 'Mentions légales', href: '/legal' },
  ],
}

export function FooterNew() {
  return (
    <footer className="bg-[#097870] text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <span className="font-display font-bold text-2xl text-white block mb-3">Rentanoo</span>
            <p className="font-body text-white/70 text-sm leading-relaxed">
              Nosy Be comme tu l'imagines.<br />
              Sans les galères.
            </p>
          </div>

          {/* Véhicules */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Véhicules</h4>
            <ul className="space-y-2">
              {LINKS.vehicules.map(l => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="font-body text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hébergements */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Hébergements</h4>
            <ul className="space-y-2">
              {LINKS.hebergements.map(l => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="font-body text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rentanoo */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Rentanoo</h4>
            <ul className="space-y-2">
              {LINKS.rentanoo.map(l => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="font-body text-white/70 hover:text-white text-sm transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-white/50 text-sm">
            © 2026 Rentanoo — Nosy Be, Madagascar
          </p>
          <p className="font-body text-white/50 text-sm">
            Paiement sécurisé Stripe · Données protégées RGPD
          </p>
        </div>
      </div>
    </footer>
  )
}
