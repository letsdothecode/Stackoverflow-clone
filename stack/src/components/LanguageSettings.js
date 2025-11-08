import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LanguageSettings = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [verificationMethod, setVerificationMethod] = useState('email');
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
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/language', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentLanguage(response.data.language);
      setTargetLanguage(response.data.language);
    } catch (error) {
      console.error('Error fetching user language:', error);
      setError('Error loading language settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async () => {
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/language/request-change',
        {
          language: targetLanguage,
          method: verificationMethod
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setOtpSent(true);
        setMessage(response.data.message);
      }
    } catch (error) {
      console.error('Error requesting language change:', error);
      setError(error.response?.data?.message || 'Error sending OTP');
    }
  };

  const handleVerifyAndChange = async () => {
    setMessage('');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/language/verify-change',
        {
          otp,
          language: targetLanguage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.data.success) {
        setMessage(response.data.message);
        setCurrentLanguage(response.data.language);
        setOtpSent(false);
        setOtp('');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError(error.response?.data?.message || 'Error changing language');
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
              <option value="de">German</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Verification Method</label>
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
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