'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import UserSidebar from '@/components/ui/UserSidebar'
import Footer from '@/components/layout/Footer'
import type { Adoption } from '@/types'

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    Pending:  { background: 'rgba(245,158,11,.08)', color: '#f59e0b', border: '1.5px solid rgba(245,158,11,.25)' },
    Approved: { background: 'rgba(34,197,94,.08)',  color: '#16a34a', border: '1.5px solid rgba(34,197,94,.25)'  },
    Rejected: { background: 'rgba(239,68,68,.08)',  color: '#ef4444', border: '1.5px solid rgba(239,68,68,.25)'  },
  }
  const labels: Record<string, string> = {
    Pending:  'In Process',
    Approved: 'Approved',
    Rejected: 'Rejected',
  }
  return (
    <span style={{
      padding: '6px 16px', borderRadius: '20px', fontSize: '.8rem', fontWeight: 600,
      whiteSpace: 'nowrap', ...(styles[status] || styles.Pending),
    }}>
      {labels[status] || status}
    </span>
  )
}

export default function AdoptionsPage() {
  const { user, authReady } = useAuth()
  const router   = useRouter()
  const [apps, setApps] = useState<Adoption[]>([])

  useEffect(() => {
    if (!authReady) return
    if (!user) { router.replace('/login'); return }

    const loadApps = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('adoptions')
        .select('id, pet_id, status, note, created_at, pets(name, breed, image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error || !data) return

      const mapped: Adoption[] = data.map((row: {
        id: string
        pet_id: string
        status: 'Pending' | 'Approved' | 'Rejected'
        note: string | null
        created_at: string
        pets: { name: string; breed: string; image_url: string | null } | Array<{ name: string; breed: string; image_url: string | null }> | null
      }) => {
        const pet = Array.isArray(row.pets) ? row.pets[0] : row.pets
        return {
          id: row.id,
          petId: row.pet_id,
          petName: pet?.name || 'Pet',
          petImg: pet?.image_url || '/login-dog.png',
          petBreed: pet?.breed || '-',
          housing: '-',
          otherPets: '-',
          motivation: row.note || '-',
          status: row.status,
          date: row.created_at,
        }
      })
      setApps(mapped)
    }

    void loadApps()
  }, [authReady, user, router])

  if (!authReady) return null
  if (!user) return null

  return (
    <>
      <div className="page-wrapper">
        <div style={{ padding: '0 40px 48px' }}>
          <div style={{
            background: 'var(--bg-gray)', borderRadius: '16px',
            padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start',
          }}>
            <UserSidebar />

            {/* Content */}
            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>My Adoption Applications</h2>

              {apps.length === 0 ? (
                <div className="empty">
                  <span className="empty-icon">📋</span>
                  <h3>No applications yet</h3>
                  <p>You haven&apos;t submitted any adoption requests yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {apps.map(app => (
                    <div key={app.id} style={{
                      display: 'grid', gridTemplateColumns: '100px 1fr auto',
                      gap: '16px', alignItems: 'center',
                      background: 'var(--bg-gray)', borderRadius: '12px', padding: '16px',
                    }}>
                      {/* Pet Image */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={app.petImg} alt={app.petName}
                        style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                      />

                      {/* Info */}
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                          {app.petName}
                        </div>
                        <div style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          {app.petBreed}
                        </div>
                        {app.motivation && app.motivation !== '-' && (
                          <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontStyle: 'italic' }}>
                            &quot;{app.motivation}&quot;
                          </div>
                        )}
                        <div style={{ fontSize: '.75rem', color: 'var(--text-dim)' }}>
                          Submitted on {new Date(app.date).toLocaleDateString('en-US', {
                            month: 'long', day: 'numeric', year: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Status */}
                      <StatusBadge status={app.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
