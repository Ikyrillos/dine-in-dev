import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import queryClient from '@/core/queryClient'
import { QueryClientProvider } from '@tanstack/react-query'
import Header from '../components/Header'

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Header />

      <Outlet />
      <TanStackRouterDevtools />
    </QueryClientProvider>
  ),
})
