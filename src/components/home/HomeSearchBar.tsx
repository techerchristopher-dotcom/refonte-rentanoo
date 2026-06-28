import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

const CATEGORIES = [
  { value: '', label: 'Tous les types' },
  { value: 'scooter', label: 'Scooters' },
  { value: 'moto', label: 'Motos' },
  { value: 'voiture', label: 'Voitures' },
  { value: 'quad', label: 'Quads & Buggies' },
  { value: 'hebergement', label: 'Hébergements' },
]

export function HomeSearchBar() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('')
  const navigate = useNavigate()

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('start', startDate)
    if (endDate) params.set('end', endDate)
    if (category) params.set('cat', category)
    const qs = params.toString()
    navigate(`/${qs ? `?${qs}` : ''}#search-results`)
  }

  return (
    <div className="relative z-20 -mt-16 mx-auto max-w-4xl px-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Date arrivée */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-white/50 uppercase tracking-wider px-1">Arrivée</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#0FBFB0] focus:border-transparent"
            />
          </div>
          {/* Date départ */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-white/50 uppercase tracking-wider px-1">Départ</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate}
              className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#0FBFB0] focus:border-transparent"
            />
          </div>
          {/* Catégorie */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-white/50 uppercase tracking-wider px-1">Catégorie</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 text-white font-body text-sm focus:outline-none focus:ring-2 focus:ring-[#0FBFB0] focus:border-transparent"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value} className="text-[#0D1E26] bg-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          {/* CTA */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-xs text-transparent uppercase tracking-wider px-1">Action</label>
            <Button
              variant="ember"
              className="h-full rounded-xl py-3 font-display font-semibold text-base"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4 mr-2" />
              Voir les offres
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
