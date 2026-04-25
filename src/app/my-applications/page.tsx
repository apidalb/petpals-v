'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MyApplicationsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile/adoptions')
  }, [router])
  return null
}