import { useExchangeRate } from '@/contexts/ExchangeRateContext'

export function HomeLiveTicker() {
  const { config } = useExchangeRate()
  const rate = config?.rate

  const items = [
    'LIVE',
    '🌊 Lagon de Nosy Be',
    '📍 Nosy Be, Madagascar',
    ...(rate ? [`💱 1€ = ${rate.toLocaleString('fr-FR')} MGA`] : []),
    '✈ Vols NOS · Aéroport Fascène',
    '🌴 Livraison incluse',
    '✓ Assurance comprise',
  ]

  // Duplicate for seamless loop
  const allItems = [...items, ...items]

  return (
    <div className="bg-[#0B1A1F] overflow-hidden py-2 relative z-40">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-12 px-4 font-mono text-sm text-[#0FBFB0]/80">
        {allItems.map((item, i) => (
          <span key={i} className="shrink-0">{item}</span>
        ))}
      </div>
    </div>
  )
}
