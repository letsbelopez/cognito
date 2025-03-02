import { useState } from 'react'
import { AuthProvider, useSignUp, useSignIn, useSignOut, useCurrentUser } from '@letsbelopez/react-cognito'
import './App.css'

const cognitoConfig = {
  userPoolId: 'YOUR_USER_POOL_ID',
  clientId: 'YOUR_CLIENT_ID',
  region: 'YOUR_REGION',
}

function AuthContent() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
  })
  const [isSignUp, setIsSignUp] = useState(false)

  const { execute: signUp, isLoading: isSigningUp, error: signUpError } = useSignUp()
  const { execute: signIn, isLoading: isSigningIn, error: signInError } = useSignIn()
  const { execute: signOut } = useSignOut()
  const { user, isAuthenticated, isLoading } = useCurrentUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { username, password, email } = formData

    if (isSignUp) {
      await signUp(username, password, email)
    } else {
      await signIn(username, password)
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
        <h2>Welcome, {user.username}!</h2>
        <button onClick={signOut} className="auth-button">
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
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
        )}
        {(signUpError || signInError) && (
          <div className="error-message">
            {signUpError?.message || signInError?.message}
          </div>
        )}
        <button type="submit" className="auth-button" disabled={isSigningUp || isSigningIn}>
          {isSigningUp || isSigningIn ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      <button
        onClick={() => setIsSignUp(!isSignUp)}
        className="toggle-button"
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
      </button>
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
