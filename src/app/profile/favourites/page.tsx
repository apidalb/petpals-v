'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import UserSidebar from '@/components/ui/UserSidebar'
import Footer from '@/components/layout/Footer'
import type { Pet, PetType, PetStatus } from '@/types'

export default function FavouritesPage() {
  const { user, authReady } = useAuth()
  const router = useRouter()
  const [favs, setFavs]               = useState<Pet[]>([])
  const [adoptedByMe, setAdoptedByMe] = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!authReady) return
    if (!user) { router.replace('/login'); return }

    const loadFavs = async () => {
      const supabase = createClient()

      // Fetch favorites + approved adoptions user secara paralel
      const [favsRes, adoptionsRes] = await Promise.all([
        supabase
          .from('favorites')
          .select('pet_id, pets(id, name, type, breed, age_years, gender, weight, location, status, image_url)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('adoptions')
          .select('pet_id')
          .eq('user_id', user.id)
          .eq('status', 'Approved'),
      ])

      // Set IDs hewan yang berhasil diadopsi oleh user ini
      const myAdoptedIds = new Set<string>(
        (adoptionsRes.data ?? []).map((r: { pet_id: string }) => r.pet_id)
      )
      setAdoptedByMe(myAdoptedIds)

      if (favsRes.error || !favsRes.data) { setLoading(false); return }

      const pets: Pet[] = favsRes.data.flatMap((row: { pet_id: string; pets: unknown }) => {
          const p = (Array.isArray(row.pets) ? row.pets[0] : row.pets) as {
            id: string; name: string | null; type: string | null; breed: string | null
            age_years: number | null; gender: string | null; weight: string | null
            location: string | null; status: string | null; image_url: string | null
          } | null
          if (!p) return []

          // Sembunyikan hewan Adopted yang diadopsi orang lain
          if (p.status === 'Adopted' && !myAdoptedIds.has(p.id)) return []

          const type = ['Dog','Cat','Bird','Reptile'].includes(p.type ?? '') ? p.type as PetType : 'Reptile'
          const status = ['Available','Adopted','In Process'].includes(p.status ?? '') ? p.status as PetStatus : 'Available'
          const pet: Pet = {
            id: p.id, name: p.name ?? 'Pet', type,
            breed: p.breed ?? '-',
            age: p.age_years != null ? `${p.age_years} years` : '-',
            gender: p.gender ?? 'Unknown', weight: p.weight ?? '-',
            location: p.location ?? '-', status,
            vaccinated: false, neutered: false,
            img: p.image_url ?? '/login-dog.png', desc: '',
          }
          return [pet]
        })

      setFavs(pets)
      setLoading(false)
    }

    void loadFavs()
  }, [authReady, user, router])

  const removeFav = async (petId: string | number) => {
    if (!user) return
    const supabase = createClient()
    await supabase.from('favorites').delete()
      .eq('user_id', user.id).eq('pet_id', String(petId))
    setFavs(prev => prev.filter(p => p.id !== petId))
  }

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

            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>My Favourites</h2>

              {loading ? (
                <div className="empty"><span className="empty-icon">⏳</span><h3>Loading...</h3></div>
              ) : favs.length === 0 ? (
                <div className="empty">
                  <span className="empty-icon">🤍</span>
                  <h3>No favourites yet</h3>
                  <p>Browse pets and click the heart icon to save your favourites.</p>
                  <Link href="/pets"><button className="btn btn-primary" style={{ marginTop: '8px' }}>Browse Pets</button></Link>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {favs.map(p => {
                    const isAdoptedByMe = adoptedByMe.has(String(p.id))
                    return (
                      <div key={p.id} style={{ width: '150px', position: 'relative' }}>
                        {/* Badge adopted by user */}
                        {isAdoptedByMe && (
                          <div style={{
                            position: 'absolute', top: '6px', left: '6px', zIndex: 1,
                            background: 'rgba(34,197,94,.85)', color: '#fff',
                            borderRadius: '6px', padding: '2px 7px',
                            fontSize: '.65rem', fontWeight: 700,
                          }}>
                            Adopted by you
                          </div>
                        )}
                        {/* Heart button — sembunyikan jika sudah diadopsi sendiri */}
                        {!isAdoptedByMe && (
                          <button
                            onClick={() => removeFav(p.id)}
                            style={{
                              position: 'absolute', top: '6px', right: '6px', zIndex: 1,
                              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                              borderRadius: '50%', width: '28px', height: '28px',
                              cursor: 'pointer', fontSize: '.8rem', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                            }}
                            aria-label="Remove from favourites"
                          >❤️</button>
                        )}
                        <Link href={`/pets/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.img} alt={p.name}
                            style={{ width: '150px', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
                          />
                          <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text)', marginBottom: '3px' }}>{p.name}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{p.age} · {p.location}</div>
                        </Link>
                      </div>
                    )
                  })}
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