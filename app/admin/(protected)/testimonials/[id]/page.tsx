import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { TestimonialEditForm } from '@/components/admin/TestimonialEditForm'
import type { Testimonial } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function TestimonialEditPage({ params }: Props) {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('testimonials')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  return <TestimonialEditForm testimonial={data as Testimonial} />
}
