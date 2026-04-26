'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import ConfirmAdoptionModal from '@/components/ui/ConfirmAdoptionModal'
import type { Pet, PetType } from '@/types'

export default function AdoptPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user, authReady } = useAuth()
  const { showToast } = useToast()
  const [pet, setPet]           = useState<Pet | null>(null)
  const [loading, setLoading]   = useState(false)
  const [motivation, setMotivation] = useState('')
  const [jenis, setJenis]           = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingData, setPendingData] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchPet = async () => {
      const routeId = Array.isArray(id) ? id[0] : id
      if (!routeId) {
        setPet(null)
        return
      }
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, type, breed, age_years, gender, weight, location, status, vaccinated, neutered, description, image_url')
        .eq('id', routeId)
        .single()

      if (error || !data) { setPet(null); return }

      const normalizedType =
        data.type === 'Dog' || data.type === 'Cat' || data.type === 'Bird' || data.type === 'Reptile'
          ? data.type : 'Reptile'
      const status =
        data.status === 'Adopted' || data.status === 'In Process' || data.status === 'Available'
          ? data.status : 'Available'

      setPet({
        id: data.id,
        name: data.name ?? 'Unnamed Pet',
        type: normalizedType as PetType,
        breed: data.breed ?? '-',
        age: data.age_years != null ? `${data.age_years} years` : '-',
        gender: (data.gender as string | null) ?? '-',
        weight: (data.weight as string | null) ?? '-',
        location: (data.location as string | null) ?? '-',
        status,
        vaccinated: (data.vaccinated as boolean | null) ?? false,
        neutered: (data.neutered as boolean | null) ?? false,
        img: data.image_url ?? '/login-dog.png',
        desc: data.description ?? 'No description yet.',
      })
    }
    fetchPet()
  }, [id])

  useEffect(() => {
    if (!authReady) return
    if (!user) router.replace('/login')
    else if (user.role === 'admin') router.replace('/admin')
  }, [authReady, user, router])

  if (!authReady) return null

  if (!pet) return (
    <div className="page-wrapper">
      <div className="empty" style={{ paddingTop: '80px' }}>
        <span className="empty-icon">🐾</span>
        <h3>Pet not found</h3>
        <Link href="/pets"><button className="btn btn-primary" style={{ marginTop: '16px' }}>← Back</button></Link>
      </div>
    </div>
  )

  if (!user) return null

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data: Record<string, string> = {}
    const homeType = (form.elements.namedItem('homeType') as HTMLSelectElement).value
    if (!homeType) { showToast('Please select a home type.', 'err'); return }
    if (motivation.trim().length < 5) { showToast('Please enter your adoption motivation.', 'err'); return }
    Array.from(form.elements).forEach(el => {
      const input = el as HTMLInputElement
      if (input.name && input.value) data[input.name] = input.value
    })
    data.motivation = motivation
    data.jenis      = jenis
    setPendingData(data)
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    setLoading(true)

    const supabase = createClient()
    const userId   = user.id

    if (userId && pet.id) {
      const { error } = await supabase
        .from('adoptions')
        .insert({
          user_id:                userId,
          pet_id:                 pet.id,
          status:                 'Pending',
          note:                   motivation,
          full_name:              pendingData.fullName  || null,
          phone:                  pendingData.phone     || null,
          address:                pendingData.address   || null,
          home_type:              pendingData.homeType  || null,
          rented_house:           pendingData.rentedHouse === 'yes',
          have_yard:              pendingData.yard      === 'yes',
          owned_before:           pendingData.ownedBefore === 'yes',
          other_pet_types:        pendingData.jenis     || null,
          maintenance_costs_ready: pendingData.maintenanceCosts === 'yes',
        })

      if (!error) {
        showToast(`Adoption request for ${pet.name} submitted!`, 'ok')
        router.push('/profile/adoptions')
        return
      }
    }

    showToast('Failed to submit request. Please try again.', 'err')
    setLoading(false)
  }

  return (
    <>
      {showConfirm && (
        <ConfirmAdoptionModal
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="page-wrapper">
        <div style={{ background: 'var(--bg)', padding: '0 40px 48px' }}>
          <div style={{
            background: 'var(--bg-gray)', borderRadius: '16px', padding: '28px',
            display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px',
          }}>
            {/* Pet Sidebar */}
            <div>
              <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pet.img} alt={pet.name} style={{ width: '100%', height: '180px', objectFit: 'cover', background: '#e5e7eb' }} />
                <div style={{ padding: '14px' }}>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '4px' }}>Nama : <strong>{pet.name}</strong></p>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '4px' }}>Location : <strong>{pet.location}</strong></p>
                  <p style={{ fontSize: '.85rem', color: 'var(--text-2)' }}>Status : <strong>{pet.status}</strong></p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px' }}>

              {/* Personal Information */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '16px' }}>Personal Information</h3>
                <div className="f-group">
                  <label className="f-label">Full name <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="f-input" name="fullName" defaultValue={user.name} required />
                </div>
                <div className="f-group">
                  <label className="f-label">Email <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="f-input" name="email" type="email" defaultValue={user.email} required />
                </div>
                <div className="f-group">
                  <label className="f-label">Phone Number <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="f-input" name="phone" type="tel" placeholder="+62..." required />
                </div>
                <div className="f-group">
                  <label className="f-label">Adress <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="f-input" name="address" placeholder="Your address" required />
                </div>
              </div>

              {/* Home Information */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '16px' }}>Home Information</h3>
                <div className="f-group">
                  <label className="f-label">Type of Home <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select className="f-select" name="homeType">
                    <option value="">Choose one</option>
                    <option value="House">House</option>
                    <option value="Apartement">Apartement</option>
                    <option value="Kos">Kos</option>
                    <option value="Shared House">Shared House</option>
                    <option value="Dormitory/Asrama">Dormitory/Asrama</option>
                  </select>
                </div>
                <div className="f-group">
                  <label className="f-label">Rented House <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div className="radio-group">
                    <label className="radio-chip"><input type="radio" name="rentedHouse" value="yes" required /> Yes</label>
                    <label className="radio-chip"><input type="radio" name="rentedHouse" value="no"  /> No</label>
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label">Have a Yard <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div className="radio-group">
                    <label className="radio-chip"><input type="radio" name="yard" value="yes" required /> Yes</label>
                    <label className="radio-chip"><input type="radio" name="yard" value="no"  /> No</label>
                  </div>
                </div>
              </div>

              {/* Pet Experience */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '4px' }}>Pet Experience</h3>
                <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Optional — fill in if relevant</p>
                <div className="f-group">
                  <label className="f-label">Owned Pet Before</label>
                  <div className="radio-group">
                    <label className="radio-chip"><input type="radio" name="ownedBefore" value="yes" /> Yes</label>
                    <label className="radio-chip"><input type="radio" name="ownedBefore" value="no"  /> No</label>
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label">Currently Have Other Pets</label>
                  <div className="radio-group">
                    <label className="radio-chip"><input type="radio" name="haveYard" value="yes" /> Yes</label>
                    <label className="radio-chip"><input type="radio" name="haveYard" value="no"  /> No</label>
                  </div>
                </div>
                <div className="f-group">
                  <label className="f-label">Types of other pets you own</label>
                  <input className="f-input" placeholder="e.g. cats, rabbits (optional)" value={jenis} onChange={e => setJenis(e.target.value)} />
                </div>
              </div>

              {/* Adoption */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '.95rem', fontWeight: 700, marginBottom: '16px' }}>Adoption</h3>
                <div className="f-group">
                  <label className="f-label">Motivation <span style={{ color: 'var(--red)' }}>*</span></label>
                  <input className="f-input" placeholder="Type here..." value={motivation} onChange={e => setMotivation(e.target.value)} required />
                </div>
                <div className="f-group">
                  <label className="f-label">Ready for the maintenance costs? <span style={{ color: 'var(--red)' }}>*</span></label>
                  <div className="radio-group">
                    <label className="radio-chip"><input type="radio" name="maintenanceCosts" value="yes" required /> Yes</label>
                    <label className="radio-chip"><input type="radio" name="maintenanceCosts" value="no"  /> No</label>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {[
                    'I commit to taking good care of the pet',
                    'I will not abandon the pet',
                    'I agree to follow the adoption rules',
                  ].map(text => (
                    <label key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem', color: 'var(--text-2)', cursor: 'pointer' }}>
                      <input type="checkbox" required style={{ accentColor: 'var(--green)', width: '15px', height: '15px' }} />
                      {text}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
