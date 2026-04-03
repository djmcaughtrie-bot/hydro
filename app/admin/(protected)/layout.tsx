import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check using standard (anon) client — reads session from cookies
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  // Fetch new leads count for sidebar badge — uses service role client
  const adminClient = createAdminClient()
  const { count: newLeadsCount } = await adminClient
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar newLeadsCount={newLeadsCount ?? 0} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="mx-auto max-w-6xl px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
