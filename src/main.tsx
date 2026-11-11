import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'
import { Providers } from './app/providers'
import './index.css'

const enableMocking = async () => {
  const { worker } = await import('./mocks/browser')
  await worker.start({
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>,
  )
})
