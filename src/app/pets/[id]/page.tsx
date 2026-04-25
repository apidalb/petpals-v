'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'
import type { Pet, PetType } from '@/types'

type Comment = {
  id: string
  author: string
  content: string
  created_at: string
  user_id: string
}

export default function PetDetailPage() {
  const { id }   = useParams()
  const { user } = useAuth()
  const [pet, setPet]               = useState<Pet | null>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [activeImg, setActiveImg]   = useState(0)
  const [comment, setComment]       = useState('')
  const [comments, setComments]     = useState<Comment[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchPet = async () => {
      const routeId = String(id)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, type, breed, age_years, gender, weight, location, status, vaccinated, neutered, description, image_url')
        .eq('id', routeId)
        .single()

      if (error || !data) { setPet(null); return }

      const normalizedType =
        data.type === 'Dog' || data.type === 'Cat' || data.type === 'Bird' || data.type === 'Reptile'
          ? data.type : 'Reptile'
      const status =
        data.status === 'Adopted' || data.status === 'In Process' || data.status === 'Available'
          ? data.status : 'Available'

      setPet({
        id: data.id,
        name: data.name ?? 'Unnamed Pet',
        type: normalizedType as PetType,
        breed: data.breed ?? '-',
        age: data.age_years != null ? `${data.age_years} years` : '-',
        gender: data.gender ?? 'Unknown',
        weight: data.weight ?? '-',
        location: data.location ?? '-',
        status,
        vaccinated: data.vaccinated ?? false,
        neutered: data.neutered ?? false,
        img: data.image_url ?? '/login-dog.png',
        desc: data.description ?? 'No description yet.',
      })
    }
    fetchPet()
  }, [id])

  useEffect(() => {
    if (!user || !pet) return
    const checkApplied = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('adoptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('pet_id', String(pet.id))
        .maybeSingle()
      setHasApplied(!!data)
    }
    void checkApplied()
  }, [user, pet])

  useEffect(() => {
    if (!pet) return
    const fetchComments = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('comments')
        .select('id, author, content, created_at, user_id')
        .eq('pet_id', String(pet.id))
        .order('created_at', { ascending: false })
      setComments((data as Comment[]) ?? [])
    }
    void fetchComments()
  }, [pet])

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!comment.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('comments')
      .insert({ pet_id: String(pet!.id), user_id: user.id, author: user.name, content: comment.trim() })
      .select('id, author, content, created_at, user_id')
      .single()
    if (!error && data) {
      setComments(prev => [data as Comment, ...prev])
      setComment('')
    }
    setSubmitting(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (!error) setComments(prev => prev.filter(c => c.id !== commentId))
  }

  const images = [pet?.img, pet?.img, pet?.img, pet?.img].filter(Boolean) as string[]

  if (!pet) return (
    <div className="page-wrapper">
      <div className="empty" style={{ paddingTop: '80px' }}>
        <span className="empty-icon">🐾</span>
        <h3>Pet not found</h3>
        <Link href="/pets"><button className="btn btn-primary" style={{ marginTop: '16px' }}>&#8592; Back</button></Link>
      </div>
    </div>
  )

  return (
    <>
      <div className="page-wrapper">
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
          <div className="detail-layout">
            {/* Gallery */}
            <div className="detail-gallery">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={images[activeImg]} alt={pet.name} className="detail-main-img" />
              <div className="detail-thumbs">
                {images.map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={img} alt="" className={`detail-thumb ${activeImg === i ? 'active' : ''}`} onClick={() => setActiveImg(i)} />
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="detail-info">
              <div className="detail-name-row">
                <h1 className="detail-name">{pet.name}</h1>
                <span className={`detail-badge ${pet.status === 'Adopted' ? 'adopted' : pet.status === 'In Process' ? 'process' : ''}`}>
                  {pet.status}
                </span>
              </div>
              <div className="detail-location">📍 {pet.location}</div>
              <hr className="detail-divider" />

              <div className="detail-section-title">Details</div>
              <div className="detail-specs">
                <div className="detail-spec">Age: <strong>{pet.age}</strong></div>
                <div className="detail-spec">Gender: <strong>{pet.gender}</strong></div>
                <div className="detail-spec">Breed: <strong>{pet.breed}</strong></div>
                <div className="detail-spec">Health: <strong>{pet.vaccinated ? 'Vaccinated' : 'Not vaccinated'}</strong></div>
              </div>
              <hr className="detail-divider" />

              <div className="detail-section-title">About</div>
              <p className="detail-desc">{pet.desc}</p>

              {/* CTA */}
              {pet.status === 'Available' && !hasApplied && (
                user
                  ? <Link href={`/adopt/${pet.id}`}><button className="btn btn-primary btn-lg btn-full">Adopt Now</button></Link>
                  : <Link href="/login"><button className="btn btn-primary btn-lg btn-full">Sign In to Adopt</button></Link>
              )}
              {hasApplied && (
                <div className="alert alert-ok">
                  You have already applied!{' '}
                  <Link href="/profile/adoptions" style={{ textDecoration: 'underline' }}>View status</Link>
                </div>
              )}
              {pet.status === 'Adopted' && (
                <div className="alert" style={{ background: 'var(--bg-gray)', color: 'var(--text-muted)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', fontSize: '.875rem' }}>
                  {pet.name} has already been adopted.
                </div>
              )}

              <hr className="detail-divider" />

              {/* Comments */}
              <div className="comment-section">
                <div className="detail-section-title">Comments ({comments.length})</div>

                {/* Input — only for logged-in users */}
                {user ? (
                  <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <input
                      className="comment-input"
                      placeholder="Tulis komentar..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || !comment.trim()}
                      style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      {submitting ? '...' : 'Kirim'}
                    </button>
                  </form>
                ) : (
                  <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    <Link href="/login" style={{ color: 'var(--green)', textDecoration: 'underline' }}>Login</Link> untuk menulis komentar.
                  </p>
                )}

                {/* Comment list */}
                {comments.length === 0 ? (
                  <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Belum ada komentar.</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="comment-card">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2d3748', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '.85rem', flexShrink: 0 }}>
                        {c.author?.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="comment-meta">
                          <span className="comment-author">{c.author}</span>
                          <span className="comment-date">
                            {new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="comment-text">{c.content}</p>
                        {(user?.id === c.user_id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ fontSize: '.72rem', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}