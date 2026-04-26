'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

export default function NewPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [ready,      setReady]      = useState(false)
  const [showPass,   setShowPass]   = useState(false)
  const [showPass2,  setShowPass2]  = useState(false)

  // Supabase fires PASSWORD_RECOVERY when user arrives via the reset link.
  // We wait for this event before showing the form.
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })

    // Also check if session already exists (in case the event fired before this effect ran)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form  = e.currentTarget
    const pass  = (form.elements.namedItem('password') as HTMLInputElement).value
    const pass2 = (form.elements.namedItem('confirm')  as HTMLInputElement).value

    if (pass.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (pass !== pass2)  { setError('Passwords do not match.'); return }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: pass })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut()
    showToast('Password reset successfully! Please log in.', 'ok')
    router.push('/login')
  }

  return (
    <>
      <div className="auth-layout">
        <div className="auth-form-side">
          <div className="auth-form-wrap">
            <div className="auth-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-petpals-black.png" alt="PetPals" style={{ height: '52px', width: 'auto', mixBlendMode: 'multiply' }} />
            </div>

            <h1 className="auth-h" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px' }}>
              Create a New Password
            </h1>
            <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
              Your new password must be different from previously used passwords.
            </p>

            {!ready ? (
              <div className="alert" style={{ background: 'rgba(245,158,11,.08)', color: '#92400e', border: '1px solid rgba(245,158,11,.25)', padding: '14px 16px', borderRadius: '8px', fontSize: '.875rem' }}>
                Verifying reset link... Make sure you opened this page from the link in your email.
              </div>
            ) : (
              <>
                {error && <div className="alert alert-err">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="f-group">
                    <div className="f-row-rel">
                      <input
                        className="f-input"
                        type={showPass ? 'text' : 'password'}
                        name="password"
                        placeholder="New Password"
                        required
                        minLength={6}
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>
                        {showPass ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div className="f-group">
                    <div className="f-row-rel">
                      <input
                        className="f-input"
                        type={showPass2 ? 'text' : 'password'}
                        name="confirm"
                        placeholder="Confirm Password"
                        required
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPass2(v => !v)}>
                        {showPass2 ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-outline-dark btn-full"
                    style={{ marginTop: '8px' }}
                    disabled={loading}
                  >
                    {loading ? 'Resetting…' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        <div className="auth-img-side">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-dog.png" alt="Dog" />
        </div>
      </div>
      <Footer />
    </>
  )
}