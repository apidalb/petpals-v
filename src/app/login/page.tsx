'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

function withTimeout<T>(promise: PromiseLike<T>, ms = 10000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms)
    Promise.resolve(promise)
      .then(value => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Simpan preferensi remember me sebelum createClient() dipanggil
      if (remember) {
        localStorage.setItem('pp_remember', '1')
      } else {
        localStorage.removeItem('pp_remember')
      }

      const supabase = createClient()
      const form  = e.currentTarget
      const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
      const pass  = (form.elements.namedItem('password') as HTMLInputElement).value

      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password: pass })
      )

      if (signInError || !data.user) {
        if (signInError?.code === 'email_provider_disabled') {
          setError('Email/password login is not active in Supabase (Auth > Providers > Email).')
        } else if (signInError?.message) {
          setError(signInError.message)
        } else {
          setError('Invalid email or password.')
        }
        return
      }

      let profile: { full_name?: string; role?: 'admin' | 'adopter' } | null = null
      try {
        const { data: profileData } = await withTimeout(
          supabase
            .from('profiles')
            .select('full_name, role')
            .eq('id', data.user.id)
            .maybeSingle()
          ,
          4000
        )
        profile = profileData
      } catch {
        // continue with default role when profile fetch is slow
      }

      if (!profile) {
        const fallbackName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User'

        // Fire and forget to avoid delaying sign-in UX.
        void supabase
          .from('profiles')
          .upsert(
            { id: data.user.id, full_name: fallbackName, role: 'adopter' },
            { onConflict: 'id' }
          )
      }

      const name = (profile?.full_name as string) || data.user.user_metadata?.full_name || 'User'
      const role = ((profile?.role as 'admin' | 'adopter') || 'adopter')

      login({ id: data.user.id, name, email: data.user.email ?? email, role })
      showToast(`Welcome back, ${name.split(' ')[0]}! 👋`, 'ok')
      router.push(role === 'admin' ? '/admin' : '/')
    } catch (err) {
      if (err instanceof Error && err.message === 'Request timeout') {
        setError('Connection timed out. Please try again (check your internet/VPN/ad blocker).')
      } else {
        setError('An error occurred during sign-in. Please refresh the page.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <div className="auth-layout">
    <div className="auth-form-side">
      <div className="auth-form-wrap">
          {/* Form side */}
      
          <div className="auth-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-petpals-black.png" alt="PetPals" style={{ height: '52px', width: 'auto', mixBlendMode: 'multiply' }} />
          </div>
          
          
          <h1 className="auth-h">Sign in to your account</h1>

          {error && <div className="alert alert-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="f-group">
              <input className="f-input" type="email" name="email" placeholder="Email" required autoComplete="email" />
            </div>
            <div className="f-group">
              <div className="f-row-rel">
                <input className="f-input" type={showPass ? 'text' : 'password'} name="password" placeholder="Password" required />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>
            <button type="submit" className="btn btn-dark btn-full" style={{ marginBottom: '14px' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Log In'}
            </button>

          </form>

            <div className="auth-extra">
            <div className="f-check">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <label htmlFor="remember">Remember me for 30 days</label>
            </div>
          
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <Link href="/forgot-password" style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>Forgot Password?</Link>
          </div>
          <div className="auth-switch">
            You do not have account yet? <Link href="/register">Sign In</Link>
          </div>
         </div>
         </div>
      </div>

      {/* Image side */}
      <div className="auth-img-side">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-dog.png" alt="Dog" />
      </div>
    </div>

      <Footer />

    </>
  )
}
