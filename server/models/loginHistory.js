import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const LoginHistory = sequelize.define('loginHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for anonymous/failed login attempts
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  browser: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true,
    get() {
      const value = this.getDataValue('browser');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('browser', value ? JSON.stringify(value) : null);
    }
  },
  os: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true,
    get() {
      const value = this.getDataValue('os');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('os', value ? JSON.stringify(value) : null);
    }
  },
  device: {
    type: DataTypes.STRING,
    defaultValue: 'desktop'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['success', 'failure']]
    }
  },
  failureReason: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'login_histories',
  timestamps: true,
  createdAt: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['userId', 'createdAt']
    }
  ]
});

export default LoginHistory;
