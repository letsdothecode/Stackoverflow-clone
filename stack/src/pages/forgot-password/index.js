import React, { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [resetType, setResetType] = useState('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const resetData = resetType === 'email' ? { email } : { phone };
      
      const response = await axios.post('/password-reset/request-reset', resetData);
      
      setMessage(response.data.message);
      
      // Show generated password for testing (remove in production)
      if (response.data.newPassword) {
        setGeneratedPassword(response.data.newPassword);
        setShowPassword(true);
      }
      
      // Clear form
      setEmail('');
      setPhone('');
      
    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.response?.data?.message || 'Error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email or phone number to receive a new password
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Reset Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset via:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="email"
                    checked={resetType === 'email'}
                    onChange={(e) => setResetType(e.target.value)}
                    className="mr-2"
                  />
                  Email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="phone"
                    checked={resetType === 'phone'}
                    onChange={(e) => setResetType(e.target.value)}
                    className="mr-2"
                  />
                  Phone
                </label>
              </div>
            </div>

            {/* Email Input */}
            {resetType === 'email' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your email address"
                />
              </div>
            )}

            {/* Phone Input */}
            {resetType === 'phone' && (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your phone number (e.g., +1234567890)"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-green-800 text-sm">{message}</p>
            </div>
          )}

          {/* Generated Password (for testing) */}
          {showPassword && generatedPassword && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-blue-800 text-sm mb-2">Generated Password (for testing):</p>
              <div className="bg-white p-2 rounded border">
                <code className="text-lg font-mono">{generatedPassword}</code>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Note: This password is case-sensitive and contains only letters (no numbers or special characters)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Send Reset Instructions'}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <a href="/auth" className="text-sm text-indigo-600 hover:text-indigo-500">
              Back to Login
            </a>
          </div>

          {/* Daily Limit Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-yellow-800 text-xs">
              <strong>Note:</strong> You can only request password reset once per day. 
              Multiple requests will be rejected.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}