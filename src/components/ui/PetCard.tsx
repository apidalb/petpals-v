'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Pet } from '@/types'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/lib/supabase/client'

interface PetCardProps {
  pet: Pet
  initialFav?: boolean
}

export default function PetCard({ pet, initialFav = false }: PetCardProps) {
  const [fav, setFav] = useState(initialFav)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  const toggleFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!user) {
      showToast('Login dulu untuk menyimpan favorit.', 'err')
      return
    }
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    if (fav) {
      await supabase.from('favorites').delete()
        .eq('user_id', user.id).eq('pet_id', String(pet.id))
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, pet_id: String(pet.id) })
    }
    setFav(v => !v)
    setLoading(false)
  }

  return (
    <div className="pet-card">
      <Link href={`/pets/${pet.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="pet-card-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pet.img} alt={pet.name} className="pet-card-img" loading="lazy" />
        </div>
      </Link>
      <div className="pet-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Link href={`/pets/${pet.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
            <div className="pet-card-name">{pet.name}</div>
            <div className="pet-card-meta">
              {pet.age}
              <span style={{ margin: '0 3px', color: 'var(--text-dim)' }}>·</span>
              📍 {pet.location}
            </div>
          </Link>
          <button
            className="pet-card-fav"
            onClick={toggleFav}
            disabled={loading}
            style={{
              marginLeft: '8px', flexShrink: 0,
              background: fav ? 'rgba(239,68,68,0.08)' : '#fff',
              border: fav ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--border)',
            }}
            aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <span style={{ fontSize: '1rem', color: fav ? '#ef4444' : '#9ca3af' }}>
              {fav ? '❤️' : '🤍'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}