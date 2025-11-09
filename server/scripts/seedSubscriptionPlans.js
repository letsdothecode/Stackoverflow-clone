import { SubscriptionPlan, sequelize } from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

const plans = [
  {
    name: 'Free',
    price: 0,
    currency: 'INR',
    maxQuestionsPerDay: 1,
    description: 'Free plan with limited question posting',
    features: ['1 question per day', 'Basic features'],
    isActive: true
  },
  {
    name: 'Bronze',
    price: 100,
    currency: 'INR',
    maxQuestionsPerDay: 5,
    description: 'Bronze plan with 5 questions per day',
    features: ['5 questions per day', 'Priority support', 'Advanced features'],
    isActive: true
  },
  {
    name: 'Silver',
    price: 300,
    currency: 'INR',
    maxQuestionsPerDay: 10,
    description: 'Silver plan with 10 questions per day',
    features: ['10 questions per day', 'Priority support', 'Advanced features', 'Analytics'],
    isActive: true
  },
  {
    name: 'Gold',
    price: 1000,
    currency: 'INR',
    maxQuestionsPerDay: 999, // Unlimited
    description: 'Gold plan with unlimited questions',
    features: ['Unlimited questions', 'Priority support', 'All advanced features', 'Analytics', 'Custom branding'],
    isActive: true
  }
];

const seedSubscriptionPlans = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    for (const planData of plans) {
      const [plan, created] = await SubscriptionPlan.findOrCreate({
        where: { name: planData.name },
        defaults: planData
      });

      if (created) {
        console.log(`✅ Created plan: ${plan.name}`);
      } else {
        // Update existing plan
        await plan.update(planData);
        console.log(`✅ Updated plan: ${plan.name}`);
      }
    }

    console.log('✅ Subscription plans seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    process.exit(1);
  }
};

seedSubscriptionPlans();

