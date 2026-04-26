'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms)
    promise
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

export default function RegisterPage() {
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
      if (remember) {
        localStorage.setItem('pp_remember', '1')
      } else {
        localStorage.removeItem('pp_remember')
      }

      const supabase = createClient()
      const form  = e.currentTarget
      const name  = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
      const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()
      const pass  = (form.elements.namedItem('password') as HTMLInputElement).value
      if (pass.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }

      const { data, error: signUpError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { full_name: name } },
        })
      )

      if (signUpError) {
        if (signUpError.code === 'email_provider_disabled') {
          setError('Email/password sign-up is not active in Supabase (Auth > Providers > Email).')
        } else {
          setError(signUpError.message)
        }
        return
      }

      const userId = data.user?.id
      const hasSession = Boolean(data.session?.user)

      if (userId && hasSession) {
        const { error: upsertError } = await supabase.from('profiles').upsert(
          { id: userId, full_name: name, role: 'adopter' },
          { onConflict: 'id' }
        )

        if (upsertError) {
          setError('Account created, but profile save failed. Please log in again.')
          router.push('/login')
          return
        }

        login({ id: userId, name, email, role: 'adopter' })
        showToast('Account created! Welcome 🎉', 'ok')
        router.push('/')
        return
      }

      showToast('Account created. Check your email to verify, then log in.', 'ok')
      router.push('/login')
    } catch (err) {
      if (err instanceof Error && err.message === 'Request timeout') {
        setError('Connection timed out. Please try again.')
      } else {
        setError('An error occurred during registration. Please refresh the page.')
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
          <div className="auth-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-petpals-black.png" alt="PetPals" style={{ height: '52px', width: 'auto', mixBlendMode: 'multiply' }} />
          </div>
          <h1 className="auth-h" style={{ fontSize: '.95rem', fontWeight: 500, color: 'var(--text-2)', marginBottom: '20px' }}>
            Create an account to run wild through our curated experiences.
          </h1>

          <button className="btn-google">
            <span style={{ fontSize: '1rem' }}>G</span> Continue with Google
          </button>

          <div className="f-divider" style={{ margin: '16px 0' }}><span>or</span></div>

          {error && <div className="alert alert-err">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="f-group">
              <input className="f-input" type="text" name="name" placeholder="Full Name" required />
            </div>
            <div className="f-group">
              <input className="f-input" type="email" name="email" placeholder="Email" required />
            </div>
            <div className="f-group">
              <div className="f-row-rel">
                <input className="f-input" type={showPass ? 'text' : 'password'} name="password" placeholder="Password" required minLength={6} />
                <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)}>{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>
            <button type="submit" className="btn btn-dark btn-full" style={{ marginBottom: '14px' }} disabled={loading}>
              {loading ? 'Creating…' : 'Create Account'}
            </button>
            <div className="f-check">
              <input
                type="checkbox"
                id="remember2"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              <label htmlFor="remember2">Remember me for 30 days</label>
            </div>
          </form>

          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <Link href="/forgot-password" style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>Forgot Password?</Link>
          </div>
          <div className="auth-switch">
            You already have account? <Link href="/login">Log in</Link>
          </div>
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
