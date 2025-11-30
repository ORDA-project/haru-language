'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // notifications 테이블에 created_at 컬럼 추가
    await queryInterface.addColumn('notifications', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백: created_at 컬럼 제거
    await queryInterface.removeColumn('notifications', 'created_at');
  }
};

