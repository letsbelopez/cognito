import React, { useState } from 'react';

interface ConfirmationFormProps {
  email: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  errors?: Record<string, string>;
}

const ConfirmationForm: React.FC<ConfirmationFormProps> = ({ 
  email, 
  onSubmit, 
  onResend, 
  errors = {} 
}) => {
  const [code, setCode] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
  };
  
  return (
    <div className="confirmation-form">
      <h2>Confirm Your Account</h2>
      <p>
        We've sent a confirmation code to <strong>{email}</strong>.
        Please enter the code below to verify your account.
      </p>
      
      {errors.form && <div className="error-message">{errors.form}</div>}
      {errors.confirmationCode && <div className="error-message">{errors.confirmationCode}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="code">Confirmation Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
        </div>
        
        <div className="form-actions">
          <button type="submit">Confirm</button>
          <button type="button" onClick={onResend} className="secondary">
            Resend Code
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfirmationForm; 