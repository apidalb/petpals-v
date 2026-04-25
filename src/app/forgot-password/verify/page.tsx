'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

function VerifyContent() {
  const searchParams = useSearchParams()
  const email        = searchParams.get('email') ?? ''
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)

  const handleResend = async () => {
    if (!email) return
    setResending(true)
    const supabase   = createClient()
    const redirectTo = `${window.location.origin}/forgot-password/new-password`
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setResending(false)
    setResent(true)
  }

  return (
    <div className="auth-form-wrap" style={{ textAlign: 'center' }}>
      <div className="auth-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-petpals-black.png" alt="PetPals" style={{ height: '52px', width: 'auto', mixBlendMode: 'multiply' }} />
      </div>

      {/* Icon */}
      <div style={{ fontSize: '3rem', margin: '8px 0 16px' }}>&#9993;</div>

      <h1 className="auth-h" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px' }}>
        Check your email
      </h1>

      <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.6' }}>
        We sent a password reset link to
      </p>
      {email && (
        <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: '24px', fontSize: '.95rem' }}>
          {email}
        </p>
      )}

      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
        Open the email and click the <strong>Reset Password</strong> link. The link will expire in 1 hour.
        Check your spam folder if you don&apos;t see it.
      </p>

      {resent ? (
        <div className="alert alert-ok" style={{ marginBottom: '16px' }}>
          Email terkirim ulang!
        </div>
      ) : (
        <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Didn&apos;t receive the email?{' '}
          <button
            onClick={handleResend}
            disabled={resending || !email}
            style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontWeight: 600, fontSize: '.82rem', fontFamily: 'inherit', padding: 0 }}
          >
            {resending ? 'Sending…' : 'Click to resend'}
          </button>
        </p>
      )}

      <Link href="/login" style={{ fontSize: '.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
        &#8592; Back to Login
      </Link>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <>
      <div className="auth-layout">
        <div className="auth-form-side">
          <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Loading…</div>}>
            <VerifyContent />
          </Suspense>
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