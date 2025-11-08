import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RewardDashboard = () => {
  const [rewardStatus, setRewardStatus] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [transferError, setTransferError] = useState('');

  useEffect(() => {
    fetchRewardData();
  }, []);

  const fetchRewardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [statusResponse, leaderboardResponse] = await Promise.all([
        axios.get('http://localhost:5000/reward/status', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5000/reward/leaderboard')
      ]);

      setRewardStatus(statusResponse.data.reward);
      setLeaderboard(leaderboardResponse.data.leaderboard);
    } catch (error) {
      console.error('Error fetching reward data:', error);
      setError('Error loading reward data');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPoints = async (e) => {
    e.preventDefault();
    setTransferMessage('');
    setTransferError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/reward/transfer',
        {
          recipientId: transferRecipient,
          points: parseInt(transferAmount, 10)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setTransferMessage(response.data.message);
        setTransferRecipient('');
        setTransferAmount('');
        fetchRewardData(); // Refresh data
      }
    } catch (error) {
      console.error('Transfer points error:', error);
      if (error.response?.data?.message) {
        setTransferError(error.response.data.message);
      } else {
        setTransferError('Error transferring points');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Reward Dashboard
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* User Reward Status */}
      {rewardStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            Your Reward Status
          </h2>
          <p className="text-lg"><strong>Points:</strong> {rewardStatus.points}</p>
          <p><strong>Total Earned:</strong> {rewardStatus.totalPointsEarned}</p>
          
          <div className="mt-4">
            <h3 className="font-semibold">Badges:</h3>
            {rewardStatus.badges.length > 0 ? (
              <ul className="list-disc list-inside">
                {rewardStatus.badges.map((badge, index) => (
                  <li key={index}>{badge.name}</li>
                ))}
              </ul>
            ) : (
              <p>No badges earned yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Transfer Points */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Transfer Points</h2>
        
        {transferMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {transferMessage}
          </div>
        )}

        {transferError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {transferError}
          </div>
        )}

        <form onSubmit={handleTransferPoints}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Recipient User ID</label>
            <input
              type="text"
              value={transferRecipient}
              onChange={(e) => setTransferRecipient(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 mt-1"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
          >
            Transfer
          </button>
        </form>
      </div>

      {/* Leaderboard */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Leaderboard</h2>
        <ul className="divide-y divide-gray-200">
          {leaderboard.map((user, index) => (
            <li key={user._id} className="py-3 flex justify-between items-center">
              <div>
                <span className="font-semibold">{index + 1}. {user.userId.name}</span>
              </div>
              <div className="text-lg font-bold text-orange-500">
                {user.totalPointsEarned} Points
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RewardDashboard;