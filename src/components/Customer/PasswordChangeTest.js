import React, { useState } from 'react';
import { updateUserPassword, validatePassword, validatePasswordStrength } from '../../services/authService';

const PasswordChangeTest = () => {
  const [testResults, setTestResults] = useState([]);

  const runTests = () => {
    const results = [];

    // Test 1: Password validation
    const weakPassword = validatePassword('123');
    results.push({
      test: 'Weak password validation',
      passed: !weakPassword.isValid,
      details: weakPassword.error || 'Should be invalid'
    });

    const strongPassword = validatePassword('MyStr0ng!Pass');
    results.push({
      test: 'Strong password validation',
      passed: strongPassword.isValid,
      details: strongPassword.isValid ? 'Valid password' : strongPassword.error
    });

    // Test 2: Password strength indicator
    const strengthTest = validatePasswordStrength('MyStr0ng!Pass');
    results.push({
      test: 'Password strength calculation',
      passed: strengthTest.strength === 'strong',
      details: `Strength: ${strengthTest.strength}, Score: ${strengthTest.score}/5`
    });

    // Test 3: Empty password validation
    const emptyPassword = validatePassword('');
    results.push({
      test: 'Empty password validation',
      passed: !emptyPassword.isValid,
      details: emptyPassword.error || 'Should be invalid'
    });

    setTestResults(results);
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5>Password Change Functionality Test</h5>
        </div>
        <div className="card-body">
          <button className="btn btn-primary mb-3" onClick={runTests}>
            Run Tests
          </button>
          
          {testResults.length > 0 && (
            <div>
              <h6>Test Results:</h6>
              {testResults.map((result, index) => (
                <div key={index} className={`alert ${result.passed ? 'alert-success' : 'alert-danger'}`}>
                  <strong>{result.test}:</strong> {result.passed ? 'PASSED' : 'FAILED'}
                  <br />
                  <small>{result.details}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordChangeTest;