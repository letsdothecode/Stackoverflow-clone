import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserSubscription = sequelize.define('userSubscription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['active', 'expired', 'cancelled', 'pending']]
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentProvider: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['stripe', 'razorpay']]
    }
  },
  paymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentCurrency: {
    type: DataTypes.STRING,
    defaultValue: 'INR'
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'completed', 'failed', 'refunded']]
    }
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_subscriptions',
  timestamps: true,
  hooks: {
    beforeUpdate: (subscription) => {
      subscription.updatedAt = new Date();
    }
  }
});

export default UserSubscription;
