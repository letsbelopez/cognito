import { useState } from 'react'
import { AuthProvider, useSignUp, useSignIn, useSignOut, useCurrentUser, useConfirmSignUp } from '@letsbelopez/react-cognito'
import './App.css'

const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
  region: import.meta.env.VITE_COGNITO_REGION,
}

function AuthContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: '',
  })
  const [isSignUp, setIsSignUp] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  const { execute: signUp, isLoading: isSigningUp, error: signUpError } = useSignUp()
  const { execute: signIn, isLoading: isSigningIn, error: signInError } = useSignIn()
  const { execute: confirmSignUp, isLoading: isConfirming } = useConfirmSignUp()
  const { execute: signOut } = useSignOut()
  const { user, isAuthenticated, isLoading } = useCurrentUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { email, password, verificationCode } = formData

    if (needsVerification) {
      try {
        // Only confirm the signup with the verification code
        await confirmSignUp(verificationEmail || email, verificationCode)
        setNeedsVerification(false)
        // After verification, automatically sign in
        await signIn(verificationEmail || email, password)
      } catch (error) {
        console.error('Verification failed:', error)
      }
    } else if (isSignUp) {
      try {
        await signUp(email, password, email)
        setVerificationEmail(email)
        setNeedsVerification(true)
      } catch (error: any) {
        if (error.message?.includes('User already exists')) {
          // If user exists but isn't verified, move to verification
          setVerificationEmail(email)
          setNeedsVerification(true)
        } else {
          console.error('Sign up failed:', error)
        }
      }
    } else {
      await signIn(email, password)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-container">
        <h2>Welcome, {user.email}!</h2>
        <button onClick={signOut} className="auth-button">
          Sign Out
        </button>
      </div>
    )
  }

  if (needsVerification) {
    return (
      <div className="auth-container">
        <h2>Verify Your Email</h2>
        {!verificationEmail && (
          <div className="form-group">
            <p>Enter the email you signed up with:</p>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
        )}
        {verificationEmail && <p>Please check your email ({verificationEmail}) for a verification code.</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="verificationCode">Verification Code:</label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              value={formData.verificationCode}
              onChange={handleInputChange}
              required
            />
          </div>
          {!verificationEmail && (
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          {signUpError && (
            <div className="error-message">
              {signUpError.message}
            </div>
          )}
          <button type="submit" className="auth-button" disabled={isSigningUp || isConfirming}>
            {isSigningUp || isConfirming ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
        <button
          onClick={() => {
            setNeedsVerification(false)
            setVerificationEmail('')
            setFormData(prev => ({ ...prev, verificationCode: '' }))
          }}
          className="toggle-button"
        >
          Back to {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
        </div>
        {(signUpError || signInError) && (
          <div className="error-message">
            {signUpError?.message || signInError?.message}
          </div>
        )}
        <button type="submit" className="auth-button" disabled={isSigningUp || isSigningIn}>
          {isSigningUp || isSigningIn ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <div className="auth-links">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp)
            setNeedsVerification(false)
          }}
          className="toggle-button"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
        <button
          onClick={() => {
            setNeedsVerification(true)
            setVerificationEmail('')
          }}
          className="toggle-button"
        >
          Need to verify your email?
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider config={cognitoConfig}>
      <div className="app">
        <h1>React Cognito Example</h1>
        <AuthContent />
      </div>
    </AuthProvider>
  )
}

export default App
