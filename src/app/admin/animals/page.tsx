'use client'

import { useEffect, useState } from 'react'
import type { Pet, PetStatus, PetType } from '@/types'
import { useToast } from '@/context/ToastContext'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { createClient } from '@/lib/supabase/client'
import { PET_IMAGES_BUCKET, buildPetImagePath, isAllowedPetImageType, isAllowedPetImageSize } from '@/lib/supabase/storage'

type DbPet = {
  id: string
  name: string | null
  type: string | null
  breed: string | null
  age_years: number | null
  gender: string | null
  weight: string | null
  location: string | null
  status: string | null
  vaccinated: boolean | null
  neutered: boolean | null
  image_url: string | null
  description: string | null
}

function mapDbPetToPet(row: DbPet): Pet {
  const type =
    row.type === 'Dog' || row.type === 'Cat' || row.type === 'Bird' || row.type === 'Reptile'
      ? row.type
      : 'Reptile'
  const status =
    row.status === 'Available' || row.status === 'Adopted' || row.status === 'In Process'
      ? row.status
      : 'Available'

  return {
    id: row.id,
    name: row.name ?? 'Unnamed Pet',
    type,
    breed: row.breed ?? '-',
    age: row.age_years != null ? `${row.age_years} years` : '-',
    gender: row.gender ?? 'Unknown',
    weight: row.weight ?? '-',
    location: row.location ?? 'Semarang',
    status,
    vaccinated: row.vaccinated ?? false,
    neutered: row.neutered ?? false,
    img: row.image_url ?? '/login-dog.png',
    desc: row.description ?? 'No description yet.',
  }
}

function getAgeYears(age: string): number | null {
  const parsed = parseInt(age, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export default function AdminAnimalsPage() {
  const { showToast } = useToast()
  const [pets, setPets]       = useState<Pet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editPet, setEditPet]     = useState<Pet | null>(null)
  const [deleteId, setDeleteId]   = useState<number | string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  // Form state
  const emptyForm = { name: '', type: 'Dog' as PetType, breed: '', age: '', gender: 'Male', weight: '', location: 'Semarang', status: 'Available' as PetStatus, vaccinated: false, neutered: false, img: '', desc: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    const fetchPets = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, type, breed, age_years, gender, weight, location, status, vaccinated, neutered, image_url, description')
        .order('created_at', { ascending: false })

      if (error || !data) {
        setPets([])
        showToast('Failed to load animals from server.', 'err')
        return
      }

      setPets(data.map(mapDbPetToPet))
    }

    fetchPets()
  }, [showToast])

  const openAdd  = () => { setEditPet(null); setForm(emptyForm); setImageFile(null); setShowModal(true) }
  const openEdit = (p: Pet) => { setEditPet(p); setForm({ ...p }); setImageFile(null); setShowModal(true) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.breed.trim()) { showToast('Name and breed are required.', 'err'); return }
    setSaving(true)
    const supabase = createClient()

    // Upload gambar jika ada file yang dipilih
    let imageUrl: string | null = form.img || null
    if (imageFile) {
      if (!isAllowedPetImageType(imageFile.type)) {
        showToast('Unsupported format. Use JPEG, PNG, or WebP.', 'err')
        setSaving(false)
        return
      }
      if (!isAllowedPetImageSize(imageFile.size)) {
        showToast('Image size must be under 5MB.', 'err')
        setSaving(false)
        return
      }
      const path = buildPetImagePath(imageFile.name)
      const { error: uploadError } = await supabase.storage
        .from(PET_IMAGES_BUCKET)
        .upload(path, imageFile, { upsert: true })
      if (uploadError) {
        showToast('Failed to upload image. Please try again.', 'err')
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from(PET_IMAGES_BUCKET).getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }

    if (editPet) {
      const { error } = await supabase
        .from('pets')
        .update({
          name: form.name,
          type: form.type,
          breed: form.breed,
          age_years: getAgeYears(form.age),
          gender: form.gender || 'Unknown',
          weight: form.weight || null,
          location: form.location || null,
          status: form.status,
          vaccinated: form.vaccinated,
          neutered: form.neutered,
          image_url: imageUrl,
          description: form.desc || null,
        })
        .eq('id', String(editPet.id))

      if (error) {
        showToast('Failed to update animal.', 'err')
        setSaving(false)
        return
      }

      setPets(prev => prev.map(p => p.id === editPet.id ? { ...form, id: editPet.id } : p))
      showToast(`Data ${form.name} updated successfully.`, 'ok')
    } else {
      const { data, error } = await supabase
        .from('pets')
        .insert({
          name: form.name,
          type: form.type,
          breed: form.breed,
          age_years: getAgeYears(form.age),
          gender: form.gender || 'Unknown',
          weight: form.weight || null,
          location: form.location || null,
          status: form.status,
          vaccinated: form.vaccinated,
          neutered: form.neutered,
          image_url: imageUrl,
          description: form.desc || null,
        })
        .select('id, name, type, breed, age_years, gender, weight, location, status, vaccinated, neutered, image_url, description')
        .single()

      if (error || !data) {
        showToast('Failed to add new animal.', 'err')
        setSaving(false)
        return
      }

      setPets(prev => [mapDbPetToPet(data), ...prev])
      showToast(`${form.name} added successfully.`, 'ok')
    }

    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (id: number | string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', String(id))

    if (error) {
      showToast('Failed to delete animal.', 'err')
      setDeleteId(null)
      return
    }

    setPets(prev => prev.filter(p => p.id !== id))
    setDeleteId(null)
    showToast('Animal deleted successfully.', 'ok')
  }

  const statusColors: Record<PetStatus, string> = {
    'Available':  'var(--teal)',
    'Adopted':    'var(--text-muted)',
    'In Process': 'var(--yellow)',
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>Animals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{pets.length} animals registered</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Animal</button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '35%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '17%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Animal', 'Type', 'Age', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pets.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{p.breed}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--text-muted)' }}>{p.type}</td>
                <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--text-muted)' }}>{p.age}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '.75rem', fontWeight: 600, color: statusColors[p.status] }}>{p.status}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '.78rem', opacity: p.status === 'Adopted' ? 0.45 : 1 }}
                      onClick={() => openEdit(p)}
                      title={p.status === 'Adopted' ? 'Hewan sudah diadopsi' : undefined}
                    >Edit</button>
                    <button
                      style={{ padding: '5px 12px', fontSize: '.78rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,.3)', background: 'rgba(248,113,113,.08)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                      onClick={() => setDeleteId(p.id)}
                    >Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)', marginBottom: '20px' }}>
              {editPet ? `Edit ${editPet.name}` : 'Add New Animal'}
            </h2>
            <div className="f-row">
              <div className="f-group">
                <label className="f-label">Name *</label>
                <input className="f-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Animal name" />
              </div>
              <div className="f-group">
                <label className="f-label">Breed *</label>
                <input className="f-input" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} placeholder="Breed / type" />
              </div>
            </div>
            <div className="f-row">
              <div className="f-group">
                <label className="f-label">Type</label>
                <select className="f-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as PetType }))}>
                  {['Dog', 'Cat', 'Bird', 'Reptile'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label">Gender</label>
                <select className="f-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  <option>Male</option><option>Female</option>
                </select>
              </div>
            </div>
            <div className="f-row">
              <div className="f-group">
                <label className="f-label">Age</label>
                <input className="f-input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="2 years" />
              </div>
              <div className="f-group">
                <label className="f-label">Weight</label>
                <input className="f-input" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="10 kg" />
              </div>
            </div>
            <div className="f-row">
              <div className="f-group">
                <label className="f-label">Status</label>
                <select
                  className="f-select"
                  value={form.status}
                  disabled={editPet?.status === 'Adopted'}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as PetStatus }))}
                >
                  <option>Available</option><option>Adopted</option><option>In Process</option>
                </select>
                {editPet?.status === 'Adopted' && (
                  <p style={{ marginTop: '4px', fontSize: '.74rem', color: 'var(--red)' }}>
                    Status cannot be changed — this animal has been adopted.
                  </p>
                )}
              </div>
              <div className="f-group">
                <label className="f-label">Location</label>
                <input className="f-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>
            <div className="f-group">
              <label className="f-label">Photo</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="f-input"
                style={{ padding: '6px' }}
                onChange={e => setImageFile(e.target.files?.[0] ?? null)}
              />
              {imageFile && (
                <p style={{ marginTop: '4px', fontSize: '.74rem', color: 'var(--teal)' }}>
                  ✓ {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {!imageFile && form.img && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={form.img} alt="preview" style={{ marginTop: '8px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
              )}
              <p style={{ marginTop: '6px', fontSize: '.74rem', color: 'var(--text-dim)' }}>
                Or enter URL directly (if not uploading a file):
              </p>
              <input
                className="f-input"
                value={imageFile ? '' : form.img}
                onChange={e => { setImageFile(null); setForm(f => ({ ...f, img: e.target.value })) }}
                placeholder="https://..."
                disabled={!!imageFile}
                style={{ marginTop: '6px', opacity: imageFile ? 0.4 : 1 }}
              />
            </div>
            <div className="f-group">
              <label className="f-label">Description</label>
              <textarea className="f-textarea" rows={3} value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.vaccinated} onChange={e => setForm(f => ({ ...f, vaccinated: e.target.checked }))} style={{ accentColor: 'var(--teal)' }} />
                Vaccinated
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.neutered} onChange={e => setForm(f => ({ ...f, neutered: e.target.checked }))} style={{ accentColor: 'var(--teal)' }} />
                Neutered
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editPet ? 'Save Changes' : 'Add Animal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId !== null && (
        <ConfirmModal
          title="Delete Animal"
          message="Are you sure you want to delete this animal? This action cannot be undone."
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
