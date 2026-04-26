'use client'

interface ConfirmModalProps {
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title   = 'Confirm Action',
  message = 'Please confirm your action.',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '40px 48px', width: '100%', maxWidth: '480px',
        position: 'relative', textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onCancel} style={{
          position: 'absolute', top: '16px', right: '20px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1.3rem', color: '#374151', lineHeight: 1,
        }}>&#10005;</button>

        {/* Title */}
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          {title}
        </h2>
        <p style={{ fontSize: '.875rem', color: '#6b7280', marginBottom: '24px' }}>{message}</p>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '28px' }} />

        {/* Yes */}
        <button onClick={onConfirm} style={{
          width: '100%', padding: '16px', borderRadius: '12px',
          background: '#1a1a2e', color: '#fff', border: 'none',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: '14px',
          transition: 'opacity .15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >Yes</button>

        <p style={{ fontSize: '.85rem', color: '#9ca3af', marginBottom: '14px', fontStyle: 'italic' }}>or</p>

        {/* No */}
        <button onClick={onCancel} style={{
          width: '100%', padding: '16px', borderRadius: '12px',
          background: '#fff', color: '#1a1a2e',
          border: '1.5px solid #1a1a2e',
          fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all .15s',
        }}
          onMouseEnter={e => { (e.currentTarget.style.background = '#f9fafb') }}
          onMouseLeave={e => { (e.currentTarget.style.background = '#fff') }}
        >No</button>
      </div>
    </div>
  )
}