import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PasswordReset = sequelize.define('passwordReset', {
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
  resetToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  resetType: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['email', 'phone']]
    }
  },
  resetValue: {
    type: DataTypes.STRING,
    allowNull: false
  },
  used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      max: 3
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => new Date(Date.now() + 3600000) // 1 hour from now
  }
}, {
  tableName: 'password_resets',
  timestamps: true,
  createdAt: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

export default PasswordReset;
