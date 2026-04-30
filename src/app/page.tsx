'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Footer from '@/components/layout/Footer'
import { createClient } from '@/lib/supabase/client'

type FeaturedPet = {
  id: string
  name: string
  age: string
  location: string
  img: string
}

// Simple card for home page — NO heart icon
function HomePetCard({ pet }: { pet: FeaturedPet }) {
  return (
    <Link href={`/pets/${pet.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: '#fff', borderRadius: '14px', overflow: 'hidden',
        border: '1px solid #e5e7eb', cursor: 'pointer',
        transition: 'all .2s', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={pet.img} alt={pet.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
        <div style={{ padding: '14px 16px' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', marginBottom: '4px' }}>{pet.name}</div>
          <div style={{ fontSize: '.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {pet.age} · 📍 {pet.location}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function HomePage() {
  const [featured, setFeatured] = useState<FeaturedPet[]>([])

  useEffect(() => {
    const fetchFeatured = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, age_years, image_url, status')
        .eq('status', 'Available')
        .order('created_at', { ascending: false })
        .limit(4)

      if (error || !data) {
        setFeatured([])
        return
      }

      const mapped: FeaturedPet[] = data.map((row) => ({
        id: row.id,
        name: row.name ?? 'Unnamed Pet',
        age: row.age_years != null ? `${row.age_years} years` : '-',
        location: 'Unknown',
        img: row.image_url ?? '/login-dog.png',
      }))

      setFeatured(mapped)
    }

    fetchFeatured()
  }, [])

  return (
    <>
    {/* HERO */}
      <div className ="hero"
          style={{
            marginTop: '20px',
            minHeight: '550px',
            borderRadius: '15px',
            backgroundImage:
              "url('/Hero Banner.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
            }}
          />

          {/* content */}
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
              Find your perfect <br /> pet today
            </h1>
            
            <Link href="/pets">
            <button className="hero-cta"
              style={{
                padding: '12px 30px',
                borderRadius: '10px',
                border: '2px solid white',
                background: 'transparent',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              See pets
            
            </button>
            </Link>
          </div>
        </div>
    

        <div className="page-wrapper">
        
        {/* FEATURED PETS */}
        <section style={{ marginTop: '60px' }}>
          <h2 style={{ marginBottom: '40px', textAlign:'center', position: 'relative', top:'-30px' }}>
            Friends who looking for a home
          </h2>
          <div
            style={{
              background: '#dcdcdc', // abu gelap
              padding: '50px 40px',
            }}
          >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {featured.map((p) => (
              <HomePetCard key={p.id} pet={p} />
            ))}
          
          </div>
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <Link href="/pets">
              <button className='see-btn'
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: '#00c26e',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                See others
              </button>
            </Link>
          </div>
          </div>      
        </section>


        {/* ── BROWSE BY TYPE ── */}
        <section className="section" style={{ paddingTop: 100 }}>
          <div className="container">
            <h2 className="section-title">Browse by pets type</h2>
            <div className="cat-grid">
              {[
                { label: 'Cat',    img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&q=80', type: 'Cat'  },
                { label: 'Dog',    img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80', type: 'Dog'  },
                { label: 'Others', img: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=200&q=80',    type: 'Bird' },
              ].map(c => (
                <Link key={c.label} href={`/pets?type=${c.type}`}>
                  <div className="cat-card">
                    <div className="cat-circle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.img} alt={c.label} />
                    </div>
                    <span className="cat-label">{c.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY ADOPT ── */}
           <div className="why-section">
            <h2 className="section-title why-title">Why adopt from us? </h2>

         <div className="why-inner">

          <div className="why-col left">
            <div className="why-item">Healthy & vaccinated pets</div>
              <div className="why-item">Trusted adoption process</div>
          </div>

    {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/Watchdog 1.png"
            alt="Why adopt"
            className="why-img"
          />

            <div className="why-col right">
             <div className="why-item">Support animal welfare</div>
               <div className="why-item">Easy online adoption</div>
           </div>

    </div>
</div>

      </div>
      <Footer />
    </>
  )
}
