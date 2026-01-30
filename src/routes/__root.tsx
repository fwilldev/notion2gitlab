import React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Header } from '../components/Header'
import { QueryProvider } from '../integrations/query/provider'
import { queryDevtoolsPlugin } from '../integrations/query/devtools'
import { Toaster } from '~/components/ui/sonner'

const devtoolsPlugins = [queryDevtoolsPlugin]

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <QueryProvider>
      <Header />
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools />
      {devtoolsPlugins.map((plugin, i) => (
        <React.Fragment key={i}>{plugin.render}</React.Fragment>
      ))}
    </QueryProvider>
  )
}
