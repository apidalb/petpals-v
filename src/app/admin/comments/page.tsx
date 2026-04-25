'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'

type CommentRow = {
  id: string
  content: string
  author: string
  created_at: string
  pet_id: string
  pets: { name: string } | null
}

export default function AdminCommentsPage() {
  const { showToast } = useToast()
  const [comments, setComments] = useState<CommentRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comments')
        .select('id, content, author, created_at, pet_id, pets(name)')
        .order('created_at', { ascending: false })

      if (error || !data) { setLoading(false); return }

      setComments(data.map((r: {
        id: string; content: string; author: string; created_at: string; pet_id: string
        pets: { name: string } | Array<{ name: string }> | null
      }) => ({
        ...r,
        pets: Array.isArray(r.pets) ? (r.pets[0] ?? null) : r.pets,
      })))
      setLoading(false)
    }
    load()
  }, [])

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) { showToast('Gagal menghapus komentar.', 'err'); return }
    setComments(prev => prev.filter(c => c.id !== id))
    showToast('Komentar dihapus.', 'ok')
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '4px' }}>
          Comments
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>{comments.length} total komentar</p>
      </div>

      {loading ? (
        <div className="empty"><h3>Memuat...</h3></div>
      ) : comments.length === 0 ? (
        <div className="empty">
          <h3>Belum ada komentar</h3>
          <p>Komentar dari user akan muncul di sini.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2d3748', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                {c.author?.charAt(0).toUpperCase() ?? '?'}
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: '.875rem' }}>{c.author}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                    {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  {c.pets?.name && (
                    <Link
                      href={`/pets/${c.pet_id}`}
                      style={{ fontSize: '.72rem', color: 'var(--green)', textDecoration: 'none', background: 'rgba(34,197,94,.08)', padding: '1px 8px', borderRadius: '20px', border: '1px solid rgba(34,197,94,.2)' }}
                    >
                      {c.pets.name}
                    </Link>
                  )}
                </div>
                <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{c.content}</p>
              </div>
              {/* Delete */}
              <button
                onClick={() => handleDelete(c.id)}
                style={{ flexShrink: 0, padding: '5px 12px', fontSize: '.78rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,.3)', background: 'rgba(248,113,113,.08)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}