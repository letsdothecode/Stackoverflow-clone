import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserLanguage = sequelize.define('userLanguage', {
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
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en',
    validate: {
      isIn: [['en', 'es', 'hi', 'pt', 'zh', 'fr']] // English, Spanish, Hindi, Portuguese, Chinese, French
    }
  },
  otp: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true,
    get() {
      const value = this.getDataValue('otp');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('otp', value ? JSON.stringify(value) : null);
    }
  }
}, {
  tableName: 'user_languages',
  timestamps: true,
  hooks: {
    beforeUpdate: (userLanguage) => {
      userLanguage.updatedAt = new Date();
    }
  }
});

export default UserLanguage;
