import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { Badge } from '@/components/ui/badge'

export function NavbarNew() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useAuth()
  const { items } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const navLinks = [
    { label: 'Véhicules', href: '/#vehicules' },
    { label: 'Hébergements', href: '/#hebergements' },
    { label: 'Blog', href: '/blog' },
  ]

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-[#D8D5CF]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className={`font-display font-bold text-xl ${scrolled ? 'text-[#0D1E26]' : 'text-white'}`}>
              Rentanoo
            </span>
          </Link>

          {/* Links desktop */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`font-display font-medium text-sm transition-colors hover:text-[#097870] ${
                  scrolled ? 'text-[#0D1E26]' : 'text-white/90'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            {/* Panier */}
            <Button
              variant="ghost"
              size="icon"
              className={scrolled ? '' : 'text-white hover:text-[#0D1E26]'}
              onClick={() => navigate('/cart')}
            >
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                {items && items.length > 0 && (
                  <Badge variant="ember" className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center">
                    {items.length}
                  </Badge>
                )}
              </div>
            </Button>

            {user ? (
              <Button
                variant={scrolled ? 'outline' : 'ghost'}
                className={scrolled ? '' : 'text-white border-white/30 hover:bg-white/10'}
                onClick={() => navigate('/me/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Mon compte
              </Button>
            ) : (
              <Button
                variant={scrolled ? 'outline' : 'ghost'}
                className={scrolled ? '' : 'text-white border-white/30 hover:bg-white/10'}
                onClick={() => navigate('/auth/login')}
              >
                Connecte-toi
              </Button>
            )}

            <Button variant="ember" onClick={() => navigate('/#vehicules')}>
              Réserver
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className={scrolled ? '' : 'text-white'}>
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-white">
              <div className="flex flex-col gap-6 pt-8">
                <span className="font-display font-bold text-xl text-[#0D1E26]">Rentanoo</span>
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="font-display font-medium text-[#0D1E26] hover:text-[#097870]"
                  >
                    {link.label}
                  </Link>
                ))}
                <hr className="border-[#D8D5CF]" />
                {user ? (
                  <Button variant="outline" onClick={() => navigate('/me/profile')}>Mon compte</Button>
                ) : (
                  <Button variant="outline" onClick={() => navigate('/auth/login')}>Connecte-toi</Button>
                )}
                <Button variant="ember" onClick={() => navigate('/#vehicules')}>Réserver</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
