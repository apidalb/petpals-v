'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Footer from '@/components/layout/Footer'

const NAV = [
  { href: '/admin',            icon: '📊', label: 'Dashboard' },
  { href: '/admin/animals',    icon: '🐾', label: 'Animals'   },
  { href: '/admin/adoptions',  icon: '📋', label: 'Adoptions' },
  { href: '/admin/comments',   icon: '💬', label: 'Comments'  },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, authReady, logout } = useAuth()
  const { showToast } = useToast()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!authReady) return
    if (user && user.role !== 'admin') router.replace('/')
    if (!user) router.replace('/login')
  }, [authReady, user, router])

  if (!authReady) return null
  if (!user || user.role !== 'admin') return null

  const handleLogout = async () => {
    await logout()
    showToast('Berhasil logout!', 'ok')
    router.push('/')
  }

  return (
    <div className="page-wrapper">
      <div className="admin-container">
        <div className="admin-wrapper">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-label">Admin Panel</div>
            <nav>
              {NAV.map(n => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`admin-nav-item ${pathname === n.href ? 'active' : ''}`}
                >
                  <span>{n.icon}</span> {n.label}
                </Link>
              ))}
            </nav>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', marginTop: '12px', paddingTop: '12px' }}>
              <button
                onClick={handleLogout}
                className="admin-nav-item"
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'rgba(255,255,255,0.5)' }}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          </aside>
          <div className="admin-content">
            {children}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}