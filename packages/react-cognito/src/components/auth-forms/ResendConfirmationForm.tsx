import React from 'react';

interface ResendConfirmationFormProps {
  email: string;
  onResend: () => void;
  errors?: Record<string, string>;
}

const ResendConfirmationForm: React.FC<ResendConfirmationFormProps> = ({ 
  email, 
  onResend, 
  errors = {} 
}) => {
  return (
    <div className="resend-confirmation-form">
      <h2>Confirmation Code Expired</h2>
      <p>
        The confirmation code sent to <strong>{email}</strong> has expired.
        Please request a new code to continue.
      </p>
      
      {errors.confirmationCode && <div className="error-message">{errors.confirmationCode}</div>}
      
      <div className="form-actions">
        <button onClick={onResend}>Resend Confirmation Code</button>
      </div>
    </div>
  );
};

export default ResendConfirmationForm; 