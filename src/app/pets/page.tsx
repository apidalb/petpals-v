'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import PetCard from '@/components/ui/PetCard'
import Footer from '@/components/layout/Footer'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { Pet } from '@/types'

export default function PetsPage() {
  return (
    <Suspense fallback={<PetsPageLoading />}>
      <PetsPageContent />
    </Suspense>
  )
}

function PetsPageLoading() {
  return (
    <>
      <div className="page-wrapper">
        <div style={{ background: 'var(--bg)', padding: '0 60px 48px' }}>
          <div className="pets-layout">
            <div className="empty">
              <span className="empty-icon">🐾</span>
              <h3>Loading pets...</h3>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

function PetsPageContent() {
  const searchParams          = useSearchParams()
  const { user }              = useAuth()
  const [pets, setPets]       = useState<Pet[]>([])
  const [favIds, setFavIds]   = useState<Set<string>>(new Set())
  const [search, setSearch]   = useState('')
  const [species, setSpecies] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [adoption, setAdoption]   = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const type = searchParams.get('type')
    if (type) setSpecies(type)
  }, [searchParams])

  // Fetch user's favorited pet IDs
  useEffect(() => {
    if (!user || user.role === 'admin') return
    const fetchFavs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('favorites')
        .select('pet_id')
        .eq('user_id', user.id)
      if (data) setFavIds(new Set(data.map((r: { pet_id: string }) => r.pet_id)))
    }
    void fetchFavs()
  }, [user])

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      if (species)    params.set('type',   species)
      if (ageFilter)  params.set('age',    ageFilter)
      if (adoption)   params.set('status', adoption)

      const query = params.toString() ? `?${params.toString()}` : ''
      try {
        const response = await fetch(`/api/pets${query}`, { cache: 'no-store' })
        if (!response.ok) { setPets([]); setLoading(false); return }
        const result = (await response.json()) as { pets?: Pet[] }
        setPets(result.pets ?? [])
      } catch {
        setPets([])
      }
      setLoading(false)
    }, 250)
    return () => clearTimeout(timeoutId)
  }, [search, species, ageFilter, adoption])

  const isAdmin = user?.role === 'admin'

  return (
    <>
      <div className="page-wrapper">
        <div style={{ background: 'var(--bg)', padding: '0 60px 48px' }}>
          <div className="pets-layout">
            <aside className="pets-sidebar">
              <div className="pets-search-wrap">
                <span className="pets-search-icon">🔍</span>
                <input
                  className="pets-search"
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="filter-select" value={species} onChange={e => setSpecies(e.target.value)}>
                <option value="">Species</option>
                <option value="Cat">Cat</option>
                <option value="Dog">Dog</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Reptile">Others</option>
              </select>
              <select className="filter-select" value={ageFilter} onChange={e => setAgeFilter(e.target.value)}>
                <option value="">Age</option>
                <option value="lt1">&lt;1 years</option>
                <option value="1-2">1-2 years</option>
                <option value="2-3">2-3 years</option>
                <option value="3-4">3-4 years</option>
                <option value="gt4">&gt;4 years</option>
              </select>
              <select className="filter-select" value={adoption} onChange={e => setAdoption(e.target.value)}>
                <option value="">Adoption</option>
                <option value="Available">Available</option>
                <option value="Adopted">Adopted</option>
              </select>
            </aside>

            <div>
              {loading ? (
                <div className="empty">
                  <span className="empty-icon">🐾</span>
                  <h3>Loading pets...</h3>
                </div>
              ) : pets.length === 0 ? (
                <div className="empty">
                  <span className="empty-icon">🐾</span>
                  <h3>No animals found</h3>
                  <p>Try changing the filter or search term.</p>
                </div>
              ) : (
                <div className="pets-grid">
                  {pets.map(p => (
                    <PetCard
                      key={p.id}
                      pet={p}
                      initialFav={favIds.has(String(p.id))}
                      showFav={!isAdmin}
                      onFavChange={(petId, isFav) => {
                        setFavIds(prev => {
                          const next = new Set(prev)
                          if (isFav) next.add(petId)
                          else next.delete(petId)
                          return next
                        })
                      }}
                    />
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