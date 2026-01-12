import React from 'react';

const PasswordRequirements = ({ password, showRequirements = true }) => {
  const requirements = [
    { key: 'minLength', text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { key: 'hasUpperCase', text: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { key: 'hasLowerCase', text: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { key: 'hasNumbers', text: 'One number', test: (pwd) => /\d/.test(pwd) },
    { key: 'hasSpecialChar', text: 'One special character', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
  ];

  if (!showRequirements || !password) return null;

  return (
    <div className="password-requirements mt-2">
      <small className="text-muted d-block mb-1">Password requirements:</small>
      {requirements.map((req) => {
        const isValid = req.test(password);
        return (
          <small key={req.key} className={`d-block ${isValid ? 'text-success' : 'text-muted'}`}>
            <i className={`fas fa-${isValid ? 'check' : 'circle'} me-1`}></i>
            {req.text}
          </small>
        );
      })}
    </div>
  );
};

export default PasswordRequirements;