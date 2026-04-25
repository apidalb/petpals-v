import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Pet, PetType, PetStatus } from '@/types'

type DbPetRow = {
  id: string
  name: string | null
  type: string | null
  breed: string | null
  age_years: number | null
  gender: string | null
  weight: string | null
  location: string | null
  status: string | null
  vaccinated: boolean | null
  neutered: boolean | null
  description: string | null
  image_url: string | null
}

function normalizeType(type: string | null): PetType {
  if (type === 'Dog' || type === 'Cat' || type === 'Bird' || type === 'Reptile') return type
  return 'Reptile'
}

function normalizeStatus(status: string | null): PetStatus {
  if (status === 'Available' || status === 'Adopted' || status === 'In Process') return status
  return 'Available'
}

function mapPet(row: DbPetRow): Pet {
  return {
    id: row.id,
    name: row.name ?? 'Unnamed Pet',
    type: normalizeType(row.type),
    breed: row.breed ?? '-',
    age: row.age_years != null ? `${row.age_years} years` : '-',
    gender: row.gender ?? '-',
    weight: row.weight ?? '-',
    location: row.location ?? '-',
    status: normalizeStatus(row.status),
    vaccinated: row.vaccinated ?? false,
    neutered: row.neutered ?? false,
    img: row.image_url ?? '/login-dog.png',
    desc: row.description ?? 'No description yet.',
  }
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase environment variables are missing.' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { searchParams } = new URL(request.url)

  const q      = (searchParams.get('q')      || '').trim()
  const type   = (searchParams.get('type')   || '').trim()
  const status = (searchParams.get('status') || '').trim()
  const age    = (searchParams.get('age')    || '').trim()

  let query = supabase
    .from('pets')
    .select('id, name, type, breed, age_years, gender, weight, location, status, vaccinated, neutered, description, image_url')
    .order('created_at', { ascending: false })

  if (q) {
    const escaped = q.replace(/[%_,]/g, '')
    query = query.or(`name.ilike.%${escaped}%,breed.ilike.%${escaped}%`)
  }

  if (type)   query = query.eq('type', type)
  if (status) query = query.eq('status', status)

  if (age === 'lt1') query = query.lt('age_years', 1)
  if (age === '1-2') query = query.gte('age_years', 1).lte('age_years', 2)
  if (age === '2-3') query = query.gte('age_years', 2).lte('age_years', 3)
  if (age === '3-4') query = query.gte('age_years', 3).lte('age_years', 4)
  if (age === 'gt4') query = query.gt('age_years', 4)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const pets = (data ?? []).map((row) => mapPet(row as DbPetRow))
  return NextResponse.json({ pets })
}