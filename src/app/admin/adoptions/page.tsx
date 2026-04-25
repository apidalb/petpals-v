'use client'

import { useEffect, useState } from 'react'
import type { Adoption, AdoptionStatus } from '@/types'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/lib/supabase/client'

export default function AdminAdoptionsPage() {
  const { showToast } = useToast()
  const [apps, setApps]         = useState<Adoption[]>([])
  const [filter, setFilter]     = useState<'All' | AdoptionStatus>('All')
  const [selected, setSelected] = useState<Adoption | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const loadAdoptions = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('adoptions')
        .select('id, pet_id, status, note, created_at, pets(name, breed, image_url)')
        .order('created_at', { ascending: false })

      if (error || !data) { setLoading(false); return }

      const mapped: Adoption[] = data.map((row: {
        id: string; pet_id: string; status: AdoptionStatus; note: string | null; created_at: string
        pets: { name: string; breed: string; image_url: string | null } | Array<{ name: string; breed: string; image_url: string | null }> | null
      }) => {
        const pet = Array.isArray(row.pets) ? row.pets[0] : row.pets
        return {
          id: row.id, petId: row.pet_id,
          petName: pet?.name || 'Pet',
          petImg: pet?.image_url || '/login-dog.png',
          petBreed: pet?.breed || '-',
          housing: '-', otherPets: '-',
          motivation: row.note || '-',
          status: row.status, date: row.created_at,
        }
      })
      setApps(mapped)
      setLoading(false)
    }
    loadAdoptions()
  }, [])

  const updateStatus = async (id: number | string, status: AdoptionStatus) => {
    const prevApps = apps
    setApps(apps.map(a => (a.id === id ? { ...a, status } : a)))
    setSelected(prev => (prev?.id === id ? { ...prev, status } : prev))

    const supabase = createClient()
    const { error } = await supabase.from('adoptions').update({ status }).eq('id', id)

    if (error) {
      setApps(prevApps)
      setSelected(prev => { const o = prevApps.find(a => a.id === prev?.id); return o ?? prev })
      showToast('Failed to update application status.', 'err')
      return
    }

    const adoption = prevApps.find(a => a.id === id)
    if (adoption?.petId) {
      const petStatus = status === 'Approved' ? 'Adopted' : 'Available'
      await supabase.from('pets').update({ status: petStatus }).eq('id', String(adoption.petId))
    }

    showToast(`Pengajuan ${status === 'Approved' ? 'approved' : 'rejected'}.`, status === 'Approved' ? 'ok' : 'err')
  }

  const filtered = filter === 'All' ? apps : apps.filter(a => a.status === filter)

  const FILTERS: { label: string; value: 'All' | AdoptionStatus; color: string; bg: string }[] = [
    { label: 'All',      value: 'All',      color: '#1a1a2e', bg: '#e5e7eb'             },
    { label: 'Pending',  value: 'Pending',  color: '#92400e', bg: 'rgba(251,191,36,.15)' },
    { label: 'Approved', value: 'Approved', color: '#065f46', bg: 'rgba(34,197,94,.15)'  },
    { label: 'Rejected', value: 'Rejected', color: '#7f1d1d', bg: 'rgba(239,68,68,.12)'  },
  ]

  const statusStyle = (s: string) => {
    if (s === 'Approved') return { color: '#065f46', bg: 'rgba(34,197,94,.12)',   border: 'rgba(34,197,94,.3)'   }
    if (s === 'Rejected') return { color: '#b91c1c', bg: 'rgba(239,68,68,.1)',    border: 'rgba(239,68,68,.25)'  }
    return                       { color: '#92400e', bg: 'rgba(251,191,36,.12)',  border: 'rgba(251,191,36,.3)'  }
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Adoptions</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{apps.length} total applications</p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const isActive = filter === f.value
          const count = f.value === 'All' ? apps.length : apps.filter(a => a.status === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '.82rem', fontWeight: isActive ? 700 : 500,
                border: isActive ? `1.5px solid ${f.color}` : '1.5px solid var(--border)',
                background: isActive ? f.bg : 'var(--bg-card)',
                color: isActive ? f.color : 'var(--text-muted)',
                transition: 'all .15s',
              }}
            >
              {f.label}
              <span style={{
                padding: '1px 7px', borderRadius: '20px', fontSize: '.72rem', fontWeight: 700,
                background: isActive ? f.color : 'var(--border)',
                color: isActive ? '#fff' : 'var(--text-muted)',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="empty">
          <span className="empty-icon">🐾</span>
          <h3>Loading applications...</h3>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🐾</span>
          <h3>No applications found</h3>
          <p>There are no adoption requests with this status.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(app => {
            const st = statusStyle(app.status)
            return (
              <div
                key={app.id}
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '56px 1fr auto auto', gap: '14px', alignItems: 'center', cursor: 'pointer', transition: 'border-color .18s' }}
                onClick={() => setSelected(app)}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={app.petImg} alt={app.petName} style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover' }} />
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{app.petName}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                    {app.petBreed} &mdash; {new Date(app.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '.75rem', fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.border}`, whiteSpace: 'nowrap' }}>
                  {app.status}
                </span>
                {app.status === 'Pending' && (
                  <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <button
                      style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(34,197,94,.12)', color: '#065f46', border: '1px solid rgba(34,197,94,.3)', fontWeight: 600, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => updateStatus(app.id, 'Approved')}
                    >Approve</button>
                    <button
                      style={{ padding: '6px 14px', borderRadius: '8px', background: 'rgba(239,68,68,.08)', color: '#b91c1c', border: '1px solid rgba(239,68,68,.25)', fontWeight: 600, fontSize: '.78rem', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => updateStatus(app.id, 'Rejected')}
                    >Reject</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e' }}>Application Detail</h2>
              <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSelected(null)}>x</button>
            </div>
            <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.petImg} alt={selected.petName} style={{ width: '72px', height: '72px', borderRadius: '10px', objectFit: 'cover' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: '4px' }}>{selected.petName}</div>
                <div style={{ fontSize: '.8rem', color: '#6b7280' }}>{selected.petBreed}</div>
                <div style={{ fontSize: '.78rem', color: '#9ca3af', marginTop: '4px' }}>
                  {new Date(selected.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            {[
              ['Motivasi',    selected.motivation],
              ['Other Pets',  selected.otherPets],
            ].map(([k, v]) => (
              <div key={k} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '4px' }}>{k}</div>
                <div style={{ fontSize: '.875rem', color: '#374151', lineHeight: '1.6' }}>{v}</div>
              </div>
            ))}
            {selected.status === 'Pending' && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { updateStatus(selected.id, 'Approved'); setSelected(null) }}>Approve</button>
                <button
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', background: 'rgba(239,68,68,.1)', color: '#b91c1c', border: '1px solid rgba(239,68,68,.25)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.9rem' }}
                  onClick={() => { updateStatus(selected.id, 'Rejected'); setSelected(null) }}
                >Reject</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}