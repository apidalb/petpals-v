'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Adoption } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AdminDashboardPage() {
  const [recentApps, setRecentApps] = useState<Adoption[]>([])
  const [pending, setPending] = useState(0)
  const [totalAnimals, setTotalAnimals] = useState(0)
  const [available, setAvailable] = useState(0)
  const [adopted, setAdopted] = useState(0)
  const { user, authReady } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authReady) return
    if (!user || user.role !== 'admin') {
      router.replace('/')
    }
  }, [user, authReady, router])

  useEffect(() => {
    const fetchAdoptions = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('adoptions')
        .select('id, pet_id, status, note, created_at, pets(name, image_url, breed)')
        .order('created_at', { ascending: false })

      if (!data) return

      setPending(data.filter(a => a.status === 'Pending').length)

      const mapped: Adoption[] = data.slice(0, 5).map((row: {
        id: string; pet_id: string; status: 'Pending' | 'Approved' | 'Rejected'
        note: string | null; created_at: string
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
      setRecentApps(mapped)
    }
    void fetchAdoptions()
  }, [])

  useEffect(() => {
    const fetchPetStats = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pets')
        .select('status')

      if (error || !data) {
        setTotalAnimals(0)
        setAvailable(0)
        setAdopted(0)
        return
      }

      setTotalAnimals(data.length)
      setAvailable(data.filter(p => p.status === 'Available').length)
      setAdopted(data.filter(p => p.status === 'Adopted').length)
    }

    fetchPetStats()
  }, [])

  const stats = [
    { icon: '🐾', label: 'Total Animals',   value: totalAnimals, color: 'var(--text)'   },
    { icon: '✅', label: 'Available',        value: available,    color: '#16a34a'       },
    { icon: '🏡', label: 'Adopted',          value: adopted,      color: 'var(--yellow)' },
    { icon: '📋', label: 'Pending Request',  value: pending,      color: 'var(--red)'    },
  ]

  return (
  <div className="admin-content fade-in">
    
    <div className="dashboard-header">
      <h1>Dashboard</h1>
      <p>Overview platform PetPALS</p>
    </div>

    
    <div className="stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div className="stat-icon">{s.icon}</div>
          <div className="stat-value" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>

    
    <div className="card">
      <div className="card-header">
        <h2>Recent Adoption Requests</h2>
        <Link href="/admin/adoptions">See all →</Link>
      </div>

      {recentApps.length === 0 ? (
        <div className="empty">📋 Belum ada pengajuan adopsi</div>
      ) : (
        <div className="adoption-list">
          {recentApps.map((app) => (
            <div key={app.id} className="adoption-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={app.petImg} alt={app.petName} />
              <div className="info">
                <div className="name">{app.petName}</div>
                <div className="meta">{app.petBreed}</div>
                <div className="meta">
                  Submitted on {new Date(app.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <span className={`status ${app.status.toLowerCase()}`}>{app.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>

)
}
