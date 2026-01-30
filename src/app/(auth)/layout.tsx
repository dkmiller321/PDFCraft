// Force dynamic rendering for auth pages since they need runtime env vars
export const dynamic = 'force-dynamic'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
