import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin-dashboard-image-upload')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin-dashboard-image-upload"!</div>
}
