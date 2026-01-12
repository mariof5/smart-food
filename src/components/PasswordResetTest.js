import React, { useState } from 'react';
import { resetPassword } from '../services/authService';

const PasswordResetTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test 1: Empty email
    try {
      const result1 = await resetPassword('');
      results.push({
        test: 'Empty email validation',
        passed: !result1.success,
        details: result1.error || 'Should fail with empty email'
      });
    } catch (error) {
      results.push({
        test: 'Empty email validation',
        passed: false,
        details: 'Unexpected error: ' + error.message
      });
    }

    // Test 2: Invalid email format
    try {
      const result2 = await resetPassword('invalid-email');
      results.push({
        test: 'Invalid email format validation',
        passed: !result2.success,
        details: result2.error || 'Should fail with invalid email format'
      });
    } catch (error) {
      results.push({
        test: 'Invalid email format validation',
        passed: false,
        details: 'Unexpected error: ' + error.message
      });
    }

    // Test 3: Valid email format (but non-existent user)
    try {
      const result3 = await resetPassword('test@nonexistent.com');
      results.push({
        test: 'Non-existent user email',
        passed: !result3.success && result3.error.includes('No account found'),
        details: result3.error || 'Should fail with user not found message'
      });
    } catch (error) {
      results.push({
        test: 'Non-existent user email',
        passed: false,
        details: 'Unexpected error: ' + error.message
      });
    }

    // Test 4: Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
    const invalidEmails = ['invalid', '@domain.com', 'user@', 'user@domain', 'user name@domain.com'];

    const emailValidationPassed = validEmails.every(email => emailRegex.test(email)) &&
                                  invalidEmails.every(email => !emailRegex.test(email));

    results.push({
      test: 'Email regex validation',
      passed: emailValidationPassed,
      details: emailValidationPassed ? 'All email validations passed' : 'Some email validations failed'
    });

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mt-4">
      <div className="card">
        <div className="card-header">
          <h5>Password Reset Functionality Test</h5>
        </div>
        <div className="card-body">
          <button 
            className="btn btn-primary mb-3" 
            onClick={runTests}
            disabled={loading}
          >
            {loading ? (
              <><i className="fas fa-spinner fa-spin me-2"></i>Running Tests...</>
            ) : (
              'Run Password Reset Tests'
            )}
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
              
              <div className="mt-3">
                <h6>Summary:</h6>
                <p>
                  <strong>Passed:</strong> {testResults.filter(r => r.passed).length} / {testResults.length}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordResetTest;