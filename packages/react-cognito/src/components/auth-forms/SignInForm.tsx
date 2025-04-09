import React, { useState } from 'react';

interface SignInFormProps {
  onSubmit: (email: string, password: string) => void;
  onCreateAccount: () => void;
  errors?: Record<string, string>;
}

const SignInForm: React.FC<SignInFormProps> = ({ onSubmit, onCreateAccount, errors = {} }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };
  
  return (
    <div className="sign-in-form">
      <h2>Sign In</h2>
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
          <button type="submit">Sign In</button>
          <button type="button" onClick={onCreateAccount} className="secondary">
            Create Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default SignInForm; 