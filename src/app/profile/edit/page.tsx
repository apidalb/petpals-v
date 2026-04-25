'use client'

import { useState, type FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/lib/supabase/client'
import UserSidebar from '@/components/ui/UserSidebar'
import Footer from '@/components/layout/Footer'

export default function EditProfilePage() {
  const { user, authReady, login } = useAuth()
  const { showToast }   = useToast()
  const router          = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authReady) return
    if (!user) router.replace('/login')
  }, [authReady, user, router])

  if (!authReady) return null
  if (!user) return null

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const form      = e.currentTarget
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement).value.trim()
    const lastName  = (form.elements.namedItem('lastName')  as HTMLInputElement).value.trim()
    const email     = (form.elements.namedItem('email')     as HTMLInputElement).value.trim()
    const phone     = (form.elements.namedItem('phone')     as HTMLInputElement).value.trim()

    const fullName = `${firstName} ${lastName}`.trim()
    const supabase = createClient()

    // Update name & phone di tabel profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id!)

    if (profileError) {
      showToast('Gagal menyimpan profil. Coba lagi.', 'err')
      setLoading(false)
      return
    }

    // Update email di Supabase Auth jika berubah
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email })
      if (emailError) {
        showToast('Profil disimpan, tapi email gagal diubah: ' + emailError.message, 'err')
      } else {
        showToast('Email diubah — cek inbox untuk konfirmasi.', 'ok')
      }
    } else {
      showToast('Profil berhasil diperbarui!', 'ok')
    }

    login({ ...user, name: fullName, email, phone })
    router.push('/profile')
  }

  const [firstName, ...rest] = user.name.split(' ')
  const lastName = rest.join(' ')

  return (
    <>
      <div className="page-wrapper">
        <div style={{ padding: '0 40px 48px' }}>
          <div style={{
            background: 'var(--bg-gray)', borderRadius: '16px',
            padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start',
          }}>
            <UserSidebar />

            {/* Edit Form */}
            <div style={{ flex: 1, background: '#fff', borderRadius: '12px', border: '1px solid var(--border)', padding: '28px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Edit Profile</h2>

              <form onSubmit={handleSubmit}>
                {/* First & Last Name */}
                <div className="f-row" style={{ marginBottom: '16px' }}>
                  <div className="f-group">
                    <label className="f-label">First Name</label>
                    <input className="f-input" name="firstName" defaultValue={firstName} placeholder="first name" />
                  </div>
                  <div className="f-group">
                    <label className="f-label">Last Name</label>
                    <input className="f-input" name="lastName" defaultValue={lastName} placeholder="last name" />
                  </div>
                </div>

                {/* Email */}
                <div className="f-group">
                  <label className="f-label">Email</label>
                  <div style={{ position: 'relative' }}>
                    <input className="f-input" name="email" type="email" defaultValue={user.email} style={{ paddingRight: '42px' }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>✅</span>
                  </div>
                </div>

                {/* Address */}
                <div className="f-group">
                  <label className="f-label">Address</label>
                  <input className="f-input" name="address" placeholder="Your address" />
                </div>

                {/* Contact Number */}
                <div className="f-group">
                  <label className="f-label">Contact Number</label>
                  <input className="f-input" name="phone" type="tel" defaultValue={(user as { phone?: string }).phone || ''} placeholder="+62..." />
                </div>

                {/* City & State */}
                <div className="f-row" style={{ marginBottom: '16px' }}>
                  <div className="f-group">
                    <label className="f-label">City</label>
                    <select className="f-select" name="city">
                      <option value="Semarang">Semarang</option>
                      <option value="Jakarta">Jakarta</option>
                      <option value="Bandung">Bandung</option>
                      <option value="Surabaya">Surabaya</option>
                      <option value="Yogyakarta">Yogyakarta</option>
                    </select>
                  </div>
                  <div className="f-group">
                    <label className="f-label">State</label>
                    <select className="f-select" name="state">
                      <option value="Jawa Tengah">Jawa Tengah</option>
                      <option value="Jawa Barat">Jawa Barat</option>
                      <option value="Jawa Timur">Jawa Timur</option>
                      <option value="DKI Jakarta">DKI Jakarta</option>
                      <option value="DIY">DIY</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="f-group">
                  <label className="f-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="f-input" name="password" type="password" placeholder="••••••••" style={{ paddingRight: '42px' }} />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>✅</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline-dark"
                    onClick={() => router.push('/profile')}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
