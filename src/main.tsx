import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { useAuthStore } from './stores/auth-store'
import TawilaShimmer from './components/LoadingBranded'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

import reportWebVitals from './reportWebVitals.ts'
import './styles.css'

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // We'll inject this
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }

  interface RouterContext {
    auth: {
      isAuthenticated: boolean
      signIn: (credentials: any) => boolean
      signOut: () => void
      isLoading: boolean
      user: any
    }
  }
}

function App() {
  const { isAuthenticated, signIn, signOut, isLoading, user } = useAuthStore();

  // Don't render router until auth is loaded
  if (isLoading) {
    return <TawilaShimmer />;
  }

  const auth = {
    isAuthenticated,
    signIn,
    signOut,
    isLoading,
    user
  };

  return <RouterProvider router={router} context={{ auth }} />;
}

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

reportWebVitals()