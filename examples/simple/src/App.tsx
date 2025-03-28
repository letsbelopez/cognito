import { useState } from 'react'
import { 
  AuthProvider, 
  useSignUp, 
  useSignIn, 
  useSignOut, 
  useCurrentUser, 
  useConfirmSignUp, 
} from '@letsbelopez/react-cognito'
import { cognitoConfig } from './config/cognitoConfig'
import './App.css'

// Debug Cognito configuration
console.log('Cognito Config:', cognitoConfig)

function AuthContent() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    verificationCode: '',
    error: '',
  })
  const [isSignUp, setIsSignUp] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  // Add a state to enable/disable auto sign-in
  const [autoSignIn, setAutoSignIn] = useState(true)

  const { execute: signUp, isLoading: isSigningUp, error: signUpError } = useSignUp()
  const { execute: signIn, isLoading: isSigningIn, error: signInError } = useSignIn()
  const { execute: confirmSignUp, isLoading: isConfirming } = useConfirmSignUp()
  const { execute: signOut } = useSignOut()
  const { user, isAuthenticated, isLoading } = useCurrentUser()

  // Debug logs for authentication state
  console.log('Auth State:', { isAuthenticated, isLoading, user })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { email, password, verificationCode } = formData

    if (needsVerification) {
      try {
        // Confirm the signup with the verification code
        const result = await confirmSignUp(verificationEmail || email, verificationCode)
        console.log('Verification result:', result)
        
        // If auto sign-in is enabled, the user will be signed in automatically
        // So no need to transition to sign-in form if user is now authenticated
        if (result.autoSignInEnabled) {
          if (!isAuthenticated) {
            // Auto sign-in should happen automatically but if it doesn't, give feedback
            console.log('Auto sign-in was enabled but user is not yet authenticated. Waiting...')
            // Give a short delay to let auth state update if needed
            setTimeout(() => {
              if (isAuthenticated) {
                setNeedsVerification(false)
              } else {
                // If auto sign-in failed, go to sign in screen
                setNeedsVerification(false)
                setIsSignUp(false)
                setFormData(prev => ({
                  ...prev,
                  verificationCode: '',
                  password: '',
                  email: verificationEmail || email,
                  error: '',
                }))
              }
            }, 1000)
          } else {
            // User is already authenticated, clear verification state
            setNeedsVerification(false)
          }
        } else {
          // If auto sign-in was not enabled, transition to sign in form
          setNeedsVerification(false)
          setIsSignUp(false)
          setFormData(prev => ({
            ...prev,
            verificationCode: '',
            password: '',
            email: verificationEmail || email,
            error: '',
          }))
        }
      } catch (error) {
        console.error('Verification failed:', error)
      }
    } else if (isSignUp) {
      try {
        // Pass the autoSignIn flag to the signUp function
        const result = await signUp(email, password, email, undefined, autoSignIn)
        console.log('Sign up result:', result)
        
        setVerificationEmail(email)
        setNeedsVerification(true)
        // Clear password after successful sign up
        setFormData(prev => ({
          ...prev,
          password: '',
          error: '',
        }));
      } catch (error: any) {
        if (error.message?.includes('User already exists')) {
          // If user exists but isn't verified, move to verification
          setVerificationEmail(email)
          setNeedsVerification(true)
          // Also clear password in this case
          setFormData(prev => ({
            ...prev,
            password: '',
            error: '',
          }));
        } else {
          console.error('Sign up failed:', error)
        }
      }
    } else {
      try {
        setFormData(prev => ({ ...prev, error: '' }))
        console.log('Starting sign in...')
        const result = await signIn(email, password)
        console.log('Sign in completed:', { result, isAuthenticated, user })
        
        // Clear form data after successful sign in
        setFormData({
          email: '',
          password: '',
          verificationCode: '',
          error: '',
        });
        
        // Force a re-render if needed
        if (!isAuthenticated) {
          console.log('Authentication state not updated, forcing refresh...')
          // Wait a moment for the state to update
          setTimeout(() => {
            setFormData(prev => ({ ...prev }))
          }, 500)
        }
      } catch (error: any) {
        console.error('Sign in failed:', error)
        const errorMessage = error.message || 'Failed to sign in. Please check your credentials and try again.'
        setFormData(prev => ({ ...prev, error: errorMessage }))
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const handleAutoSignInToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSignIn(e.target.checked)
  }

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="loading-state">
          <h2>Loading...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="auth-container">
        <div className="success-message">
          Successfully signed in!
        </div>
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
        {verificationEmail && (
          <p>
            Please check your email ({verificationEmail}) for a verification code.
            {autoSignIn && <strong> You will be automatically signed in after verification.</strong>}
          </p>
        )}
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
          {((signUpError?.message || signInError?.message || formData.error) && (
            <div className="error-message">
              {signUpError?.message || signInError?.message || formData.error}
            </div>
          ))}
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
        {isSignUp && (
          <div className="form-group form-checkbox">
            <input
              type="checkbox"
              id="autoSignIn"
              name="autoSignIn"
              checked={autoSignIn}
              onChange={handleAutoSignInToggle}
            />
            <label htmlFor="autoSignIn">
              Enable auto sign-in after email verification
            </label>
          </div>
        )}
        {((signUpError?.message || signInError?.message || formData.error) && (
          <div className="error-message">
            {signUpError?.message || signInError?.message || formData.error}
          </div>
        ))}
        <button type="submit" className="auth-button" disabled={isSigningUp || isSigningIn}>
          {isSigningUp || isSigningIn ? (
            <>
              {isSignUp ? 'Signing up...' : 'Signing in...'}
              <span className="loading-dots">...</span>
            </>
          ) : (
            isSignUp ? 'Sign Up' : 'Sign In'
          )}
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
        <h1>React Cognito</h1>
        <AuthContent />
      </div>
    </AuthProvider>
  )
}

export default App
