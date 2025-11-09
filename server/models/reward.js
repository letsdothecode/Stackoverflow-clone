import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Reward = sequelize.define('reward', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  badges: {
    type: DataTypes.TEXT, // Store as JSON string
    defaultValue: JSON.stringify([]),
    get() {
      const value = this.getDataValue('badges');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('badges', value ? JSON.stringify(value) : JSON.stringify([]));
    }
  },
  totalPointsEarned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalPointsSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'rewards',
  timestamps: true,
  hooks: {
    beforeUpdate: (reward) => {
      reward.updatedAt = new Date();
    }
  }
});

export default Reward;
