import React, { useState, useEffect } from 'react';
import axiosInstance from '../lib/axiosinstance';

const LanguageSettings = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserLanguage();
  }, []);

  const fetchUserLanguage = async () => {
    try {
      const response = await axiosInstance.get('/language');
      if (response.data && response.data.success && response.data.language) {
        setCurrentLanguage(response.data.language);
        setTargetLanguage(response.data.language);
      } else {
        setError(response.data?.message || 'Error loading language settings');
      }
    } catch (error) {
      console.error('Error fetching user language:', error);
      if (error.response) {
        // Server responded with error status
        if (error.response.status === 401) {
          setError('Please login to access language settings');
        } else {
          setError(error.response.data?.message || 'Error loading language settings');
        }
      } else if (error.request) {
        // Request made but no response received
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async () => {
    setMessage('');
    setError('');
    try {
      // Verification method is automatically determined by backend:
      // French = email, all others = SMS
      const response = await axiosInstance.post(
        '/language/request-change',
        {
          language: targetLanguage
        }
      );
      if (response.data && response.data.success) {
        setOtpSent(true);
        // If dev mode OTP is returned, show it in the message
        const message = response.data.devOtp 
          ? `${response.data.message}\n\nDevelopment Mode OTP: ${response.data.devOtp}`
          : response.data.message || 'OTP sent successfully';
        setMessage(message);
        // Auto-fill OTP in dev mode for convenience
        if (response.data.devOtp) {
          setOtp(response.data.devOtp);
        }
      } else {
        setError(response.data?.message || 'Error sending OTP');
      }
    } catch (error) {
      console.error('Error requesting language change:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Error sending OTP');
      } else if (error.request) {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  const handleVerifyAndChange = async () => {
    if (!otp || otp.trim() === '') {
      setError('Please enter the OTP');
      return;
    }
    setMessage('');
    setError('');
    try {
      const response = await axiosInstance.post(
        '/language/verify-change',
        {
          otp: otp.trim()
        }
      );
      if (response.data && response.data.success) {
        setMessage(response.data.message || 'Language changed successfully');
        setCurrentLanguage(response.data.language);
        setOtpSent(false);
        setOtp('');
        setTargetLanguage(response.data.language);
      } else {
        setError(response.data?.message || 'Error changing language');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      if (error.response) {
        setError(error.response.data?.message || 'Error changing language');
      } else if (error.request) {
        setError('Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('An unexpected error occurred');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Language Settings</h2>

      {message && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <p className="text-gray-600">Current Language: <span className="font-semibold">{currentLanguage.toUpperCase()}</span></p>
      </div>

      {!otpSent ? (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Language</label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="hi">Hindi</option>
              <option value="pt">Portuguese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Verification Method</label>
            <div className="w-full border border-gray-300 rounded px-3 py-2 mt-1 bg-gray-50">
              <span className="text-gray-700">
                {targetLanguage === 'fr' ? 'Email' : 'SMS'}
                <span className="text-sm text-gray-500 ml-2">
                  ({targetLanguage === 'fr' 
                    ? 'French language requires email verification' 
                    : 'Requires phone number in your profile'})
                </span>
              </span>
            </div>
          </div>

          <button
            onClick={handleRequestChange}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Request OTP
          </button>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            />
          </div>

          <button
            onClick={handleVerifyAndChange}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Verify and Change Language
          </button>
        </div>
      )}
    </div>
  );
};

export default LanguageSettings;