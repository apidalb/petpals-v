'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const NAV = [
  { href: '/profile',              icon: '👤', label: 'Profile'         },
  { href: '/profile/favourites',   icon: '🤍', label: 'Favourites'      },
  { href: '/profile/adoptions',    icon: '📋', label: 'My Applications' },
]

export default function UserSidebar() {
  const pathname   = usePathname()
  const router     = useRouter()
  const { logout } = useAuth()
  const { showToast } = useToast()

  const handleLogout = () => {
    logout()
    showToast('Berhasil logout!', 'ok')
    router.push('/')
  }

  return (
    <aside style={{
      width: '220px', flexShrink: 0,
      background: '#fff', borderRadius: '12px',
      border: '1px solid var(--border)',
      padding: '16px', alignSelf: 'flex-start',
      position: 'sticky', top: 'calc(var(--nav-h, 72px) + 24px)',
    }}>
      {NAV.map(n => (
        <Link key={n.href} href={n.href} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '8px', marginBottom: '2px',
            fontSize: '.9rem', fontWeight: pathname === n.href ? 700 : 400,
            color: pathname === n.href ? 'var(--text)' : 'var(--text-muted)',
            background: pathname === n.href ? 'var(--bg-gray)' : 'transparent',
            cursor: 'pointer', transition: 'all .15s',
          }}>
            <span style={{ fontSize: '1rem' }}>{n.icon}</span>
            {n.label}
          </div>
        </Link>
      ))}

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

      {/* Logout */}
      <button onClick={handleLogout} style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: '8px', width: '100%',
        fontSize: '.9rem', fontWeight: 400, color: 'var(--text-muted)',
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'all .15s', fontFamily: 'inherit',
      }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <span style={{ fontSize: '1rem' }}>🚪</span>
        Log out
      </button>
    </aside>
  )
}
