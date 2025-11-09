import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Answer = sequelize.define('answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'questions',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  answerbody: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  useranswered: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  upvote: {
    type: DataTypes.TEXT, // Store as JSON string
    defaultValue: JSON.stringify([]),
    get() {
      const value = this.getDataValue('upvote');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('upvote', value ? JSON.stringify(value) : JSON.stringify([]));
    }
  },
  downvote: {
    type: DataTypes.TEXT, // Store as JSON string
    defaultValue: JSON.stringify([]),
    get() {
      const value = this.getDataValue('downvote');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('downvote', value ? JSON.stringify(value) : JSON.stringify([]));
    }
  },
  answeredon: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'answers',
  timestamps: true,
  createdAt: 'answeredon',
  updatedAt: false
});

export default Answer;

