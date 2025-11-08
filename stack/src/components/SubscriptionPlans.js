import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [userSubscription, setUserSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentProvider, setPaymentProvider] = useState('stripe');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [plansResponse, subscriptionResponse] = await Promise.all([
        axios.get('http://localhost:5000/subscription/plans'),
        axios.get('http://localhost:5000/subscription/user-subscription', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setPlans(plansResponse.data.plans);
      setUserSubscription(subscriptionResponse.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      setError('Error loading subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setSelectedPlan(plan);
      setPaymentProcessing(true);
      setMessage('');
      setError('');

      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/subscription/create-payment',
        {
          planId: plan._id,
          paymentProvider: paymentProvider
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Handle payment based on provider
        if (paymentProvider === 'stripe' && response.data.paymentDetails.clientSecret) {
          // Stripe payment would be handled here
          setMessage('Redirecting to payment...');
          // In a real implementation, you would use Stripe Elements
        } else if (paymentProvider === 'razorpay') {
          // Razorpay payment would be handled here
          setMessage('Redirecting to Razorpay payment...');
          // In a real implementation, you would initialize Razorpay
        }
        
        // For demo purposes, show success message
        setMessage('Payment initiated successfully!');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Error processing subscription');
      }
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/subscription/cancel',
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setMessage('Subscription cancelled successfully');
        fetchSubscriptionData(); // Refresh data
      }
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setError('Error cancelling subscription');
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
        Choose Your Subscription Plan
      </h1>

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

      {userSubscription && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 mb-2">
            Current Subscription: {userSubscription.planId.name}
          </h2>
          <p className="text-blue-600 mb-4">
            Active until: {new Date(userSubscription.endDate).toLocaleDateString()}
          </p>
          <button
            onClick={handleCancelSubscription}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Cancel Subscription
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow ${
              plan.name === 'Gold' ? 'border-yellow-400 bg-yellow-50' :
              plan.name === 'Silver' ? 'border-gray-400 bg-gray-50' :
              plan.name === 'Bronze' ? 'border-orange-400 bg-orange-50' :
              'border-gray-200 bg-white'
            }`}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h3>
            <div className="text-3xl font-bold text-gray-900 mb-4">
              ₹{plan.price}
              <span className="text-sm text-gray-500">/month</span>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Questions per day:</strong> {plan.maxQuestionsPerDay === 999 ? 'Unlimited' : plan.maxQuestionsPerDay}
              </p>
              
              <div className="text-sm text-gray-600">
                <strong>Features:</strong>
                <ul className="list-disc list-inside mt-2">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            </div>

            {!userSubscription && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method:
                </label>
                <select
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="stripe">Credit/Debit Card (Stripe)</option>
                  <option value="razorpay">UPI/Net Banking (Razorpay)</option>
                </select>
              </div>
            )}

            {!userSubscription && (
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={paymentProcessing}
                className={`w-full py-2 px-4 rounded font-semibold ${
                  plan.name === 'Gold' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                  plan.name === 'Silver' ? 'bg-gray-500 hover:bg-gray-600 text-white' :
                  plan.name === 'Bronze' ? 'bg-orange-500 hover:bg-orange-600 text-white' :
                  'bg-blue-500 hover:bg-blue-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {paymentProcessing ? 'Processing...' : 'Subscribe'}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notes:</h3>
        <ul className="text-sm text-yellow-700 list-disc list-inside">
          <li>Payments are only processed between 10 AM to 11 AM IST</li>
          <li>Free plan allows 1 question per day</li>
          <li>All subscriptions are monthly and auto-renew</li>
          <li>You can cancel your subscription at any time</li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPlans;