'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (qi, Sequelize) => {
    const { INTEGER, TEXT, STRING, DATE, ENUM, JSON } = Sequelize;

    await qi.createTable('chat_messages', {
      id: { 
        type: INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
      },
      user_id: { 
        type: INTEGER, 
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
      },
      type: { 
        type: ENUM('user', 'ai'), 
        allowNull: false 
      },
      content: { 
        type: TEXT, 
        allowNull: false 
      },
      examples: { 
        type: JSON, 
        allowNull: true 
      },
      image_url: { 
        type: STRING, 
        allowNull: true 
      },
      question_id: { 
        type: INTEGER, 
        allowNull: true 
      },
      created_at: { 
        type: DATE, 
        allowNull: false, 
        defaultValue: Sequelize.fn('NOW') 
      },
    }, { 
      charset: 'utf8mb4', 
      collate: 'utf8mb4_unicode_ci' 
    });

    // 인덱스 추가
    await qi.addIndex('chat_messages', ['user_id', 'created_at'], {
      name: 'idx_chat_messages_user_created'
    });
    await qi.addIndex('chat_messages', ['user_id'], {
      name: 'idx_chat_messages_user'
    });
  },

  down: async (qi, Sequelize) => {
    await qi.dropTable('chat_messages');
  }
};

