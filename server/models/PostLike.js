import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PostLike = sequelize.define('postLike', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'post_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['postId', 'userId']
    }
  ]
});

export default PostLike;

