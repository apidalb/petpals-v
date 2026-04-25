'use client'

interface ConfirmModalProps {
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title   = 'Confirm Change',
  message = 'Please confirm your action',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        padding: '24px', width: '280px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>

        {/* Close */}
        <button onClick={onCancel} style={{
          position: 'absolute', top: '12px', right: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '1rem', color: '#6b7280', lineHeight: 1,
        }}>×</button>

        {/* Title */}
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
          {title}
        </h3>
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '16px' }} />
        <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: '20px' }}>{message}</p>

        {/* Yes */}
        <button onClick={onConfirm} style={{
          width: '100%', padding: '11px', borderRadius: '8px',
          background: '#1a1a2e', color: '#fff', border: 'none',
          fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
          fontFamily: 'inherit', marginBottom: '10px',
          transition: 'opacity .15s',
        }}>Yes</button>

        <div style={{ textAlign: 'center', fontSize: '.78rem', color: '#9ca3af', marginBottom: '10px' }}>or</div>

        {/* No */}
        <button onClick={onCancel} style={{
          width: '100%', padding: '11px', borderRadius: '8px',
          background: '#fff', color: '#1a1a2e',
          border: '1.5px solid #1a1a2e',
          fontWeight: 600, fontSize: '.9rem', cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all .15s',
        }}>No</button>
      </div>
    </div>
  )
}
