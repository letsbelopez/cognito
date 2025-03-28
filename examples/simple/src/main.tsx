import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.tsx'
import { WithAuthGuard } from './WithAuthGuard.tsx'
import { AuthProvider } from '@letsbelopez/react-cognito'
import { cognitoConfig } from './config/cognitoConfig'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider config={cognitoConfig}>
      <WithAuthGuard />
    </AuthProvider>

    {/* <App /> */}
  </StrictMode>,
)
