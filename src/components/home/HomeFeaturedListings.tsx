import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { ArrowRight, Star } from 'lucide-react'
import { getPublicListingPath } from '@/utils/vehicleType'

interface FeaturedVehicle {
  id: string
  brand: string
  model: string
  vehicle_type: string | null
  price_per_day: number
  license: string | null
  vehicle_photos?: Array<{ photo_url: string | null; is_primary: boolean | null }>
}

function getPhoto(v: FeaturedVehicle): string {
  const primary = v.vehicle_photos?.find(p => p.is_primary)?.photo_url
  const first = v.vehicle_photos?.[0]?.photo_url
  return (
    primary ||
    first ||
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80'
  )
}

const TYPE_LABEL: Record<string, string> = {
  scooter: 'Scooter',
  moto: 'Moto',
  car: 'Voiture',
  quad: 'Quad',
  accommodation: 'Hébergement',
}

export function HomeFeaturedListings() {
  const [vehicles, setVehicles] = useState<FeaturedVehicle[]>([])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('vehicles') as any
    query
      .select('id, brand, model, vehicle_type, price_per_day, license, vehicle_photos(photo_url, is_primary)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }: { data: FeaturedVehicle[] | null }) => {
        if (data) setVehicles(data)
      })
  }, [])

  if (vehicles.length === 0) return null

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0D1E26] mb-3">
          Les plus demandés
        </h2>
        <p className="font-body text-[#6B8A8D] mb-10">
          Nos offres les plus réservées à Nosy Be.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {vehicles.map(vehicle => {
            const href = getPublicListingPath({
              id: vehicle.id,
              license: vehicle.license ?? undefined,
              vehicle_type: vehicle.vehicle_type,
            })
            const typeLabel = TYPE_LABEL[vehicle.vehicle_type ?? ''] ?? vehicle.vehicle_type ?? 'Véhicule'
            const isAccomm = vehicle.vehicle_type === 'accommodation'

            return (
              <Link
                key={vehicle.id}
                to={href}
                className="group rounded-xl overflow-hidden border border-[#D8D5CF] hover:shadow-md transition-shadow bg-white"
              >
                {/* Photo */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={getPhoto(vehicle)}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-mono font-medium text-white ${
                    isAccomm ? 'bg-[#E8622F]' : 'bg-[#097870]'
                  }`}>
                    {typeLabel}
                  </span>
                </div>
                {/* Infos */}
                <div className="p-4">
                  <h3 className="font-display font-semibold text-[#0D1E26] mb-1 truncate">{`${vehicle.brand} ${vehicle.model}`}</h3>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className="h-3 w-3 fill-[#E8622F] text-[#E8622F]" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#097870] text-sm">
                      {vehicle.price_per_day.toLocaleString('fr-FR')} MGA/j
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#6B8A8D] group-hover:text-[#097870] transition-colors" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
