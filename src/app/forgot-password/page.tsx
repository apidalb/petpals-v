'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form  = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim()

    const supabase    = createClient()
    const redirectTo  = `${window.location.origin}/forgot-password/new-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    // Lewatkan email via URL param agar bisa ditampilkan di halaman verify
    router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`)
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
              Reset your password
            </h1>
            <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: '1.6' }}>
              Enter the email address linked with your account and we&apos;ll send you a reset link.
            </p>

            {error && <div className="alert alert-err">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="f-group">
                <input
                  className="f-input"
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-outline-dark btn-full"
                style={{ marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-switch" style={{ marginTop: '16px' }}>
              <Link href="/login" style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>
                &#8592; Back to Login
              </Link>
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