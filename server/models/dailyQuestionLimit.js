import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const DailyQuestionLimit = sequelize.define('dailyQuestionLimit', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  questionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  maxQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'daily_question_limits',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'date']
    },
    {
      fields: ['date']
    }
  ]
});

export default DailyQuestionLimit;
