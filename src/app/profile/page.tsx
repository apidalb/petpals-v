'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import UserSidebar from '@/components/ui/UserSidebar'
import Footer from '@/components/layout/Footer'

type FavPreview = { id: string; name: string; img: string; age: string; location: string }

export default function ProfilePage() {
  const { user, authReady } = useAuth()
  const router = useRouter()
  const [favPets, setFavPets] = useState<FavPreview[]>([])

  useEffect(() => {
    if (!authReady) return
    if (!user) { router.replace('/login'); return }

    const loadFavs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('favorites')
        .select('pet_id, pets(id, name, image_url, age_years, location)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2)

      if (!data) return

      const pets: FavPreview[] = data.flatMap((row: { pet_id: string; pets: unknown }) => {
        const p = (Array.isArray(row.pets) ? row.pets[0] : row.pets) as {
          id: string; name: string | null; image_url: string | null
          age_years: number | null; location: string | null
        } | null
        if (!p) return []
        return [{ id: p.id, name: p.name ?? 'Pet', img: p.image_url ?? '/login-dog.png', age: p.age_years != null ? `${p.age_years} years` : '-', location: p.location ?? '-' }]
      })
      setFavPets(pets)
    }

    void loadFavs()
  }, [authReady, user, router])

  if (!authReady) return null
  if (!user) return null

  const initials = user.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <>
      <div className="page-wrapper">
        <div style={{ padding: '0 40px 48px' }}>
          <div style={{
            background: 'var(--bg-gray)', borderRadius: '16px',
            padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start',
          }}>
            <UserSidebar />

            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Profile Page</h2>

              {/* Profile Card */}
              <div style={{ background: 'var(--bg-gray)', borderRadius: '12px', padding: '24px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: '#2d3748', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '2rem', fontWeight: 800, flexShrink: 0,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '6px' }}>{user.name}</h3>
                    <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{user.email}</p>
                    {(user as { phone?: string }).phone && (
                      <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '3px' }}>{(user as { phone?: string }).phone}</p>
                    )}
                    <p style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>Semarang, Jawa Tengah</p>
                  </div>
                  <Link href="/profile/edit">
                    <button className="btn btn-primary">Edit Profile</button>
                  </Link>
                </div>
              </div>

              {/* My Favourites Preview */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>My Favourites</h3>
                  <Link href="/profile/favourites" style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>&gt; see all</Link>
                </div>
                {favPets.length === 0 ? (
                  <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                    Belum ada favorit. <Link href="/pets" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Browse hewan →</Link>
                  </p>
                ) : (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {favPets.map(p => (
                      <Link key={p.id} href={`/pets/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: '130px', cursor: 'pointer' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.img} alt={p.name} style={{ width: '130px', height: '120px', objectFit: 'cover', borderRadius: '10px', marginBottom: '8px' }} />
                          <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text)' }}>{p.name}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{p.age} · {p.location}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}