'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // image_url 컬럼을 TEXT로 변경
    await queryInterface.changeColumn('chat_messages', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백: STRING(255)로 되돌리기
    await queryInterface.changeColumn('chat_messages', 'image_url', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  }
};

