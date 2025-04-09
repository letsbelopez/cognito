import React, { useState } from 'react';

interface SignUpFormProps {
  onSubmit: (email: string, password: string) => void;
  onBackToSignIn: () => void;
  errors?: Record<string, string>;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, onBackToSignIn, errors = {} }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };
  
  return (
    <div className="sign-up-form">
      <h2>Create Account</h2>
      {errors.form && <div className="error-message">{errors.form}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        
        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>
        
        <div className="form-actions">
          <button type="submit">Create Account</button>
          <button type="button" onClick={onBackToSignIn} className="secondary">
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignUpForm; 