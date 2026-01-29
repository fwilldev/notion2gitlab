import { useState } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  Home,
  Menu,
  RotateCcw,
  X,
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { resetWizard } from '~/lib/stores/wizard-store'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isInWizard = location.pathname.startsWith('/wizard')

  const handleStartOver = () => {
    if (
      window.confirm(
        'This will clear all your data and start fresh. Are you sure?',
      )
    ) {
      resetWizard()
      navigate({ to: '/wizard/step-1' })
    }
  }

  return (
    <>
      <header className="glass-header p-4 flex items-center justify-between text-foreground sticky top-0 z-50">
        <div className="flex items-center">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-white/[0.08] rounded-xl transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/notion2gitlab.png"
                alt="notion2gitlab logo"
                className="h-7 w-7"
              />
              <span>notion2gitlab</span>
            </Link>
          </h1>
        </div>

        {isInWizard && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStartOver}
            className="text-foreground/70 hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Start Over
          </Button>
        )}
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 backdrop-blur-3xl bg-[oklch(0.14_0.02_260_/_0.92)] text-foreground shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-r border-white/[0.08] ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
          <h2 className="text-xl font-bold">Navigation</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/[0.08] rounded-xl transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-primary/15 text-primary hover:bg-primary/20 transition-colors mb-2 font-semibold',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/wizard"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.06] transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-xl bg-primary/15 text-primary hover:bg-primary/20 transition-colors mb-2 font-semibold',
            }}
          >
            <ArrowRightLeft size={20} />
            <span className="font-medium">Import Wizard</span>
          </Link>
        </nav>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
