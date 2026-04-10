import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar  from '../components/Topbar'

function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main area (offset by sidebar width on desktop) ────────── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* Topbar */}
        <Topbar onMobileMenuOpen={() => setMobileOpen(true)} />

        {/* Page content */}
        <main className="flex-1 pt-16">
          <div className="page-container py-8 fade-in">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="lg:block hidden">
          <div className="page-container py-4">
            <p className="caption-text text-center">
              © {new Date().getFullYear()} USIU-Africa
              Peer-to-Peer Tutoring System
            </p>
          </div>
        </footer>

      </div>
    </div>
  )
}

export default DashboardLayout