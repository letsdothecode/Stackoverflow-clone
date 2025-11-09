import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Post = sequelize.define('post', {
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
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 1000]
    }
  },
  media: {
    type: DataTypes.TEXT, // Store as JSON string
    allowNull: true,
    defaultValue: JSON.stringify([]),
    get() {
      const value = this.getDataValue('media');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('media', value ? JSON.stringify(value) : JSON.stringify([]));
    }
  }
}, {
  tableName: 'posts',
  timestamps: true
});

export default Post;
