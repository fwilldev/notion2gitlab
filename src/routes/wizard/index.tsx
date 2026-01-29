import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/wizard/')({
  beforeLoad: () => {
    throw redirect({ to: '/wizard/step-1' })
  },
})
