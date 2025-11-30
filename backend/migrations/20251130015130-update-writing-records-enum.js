'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // MySQL에서 ENUM 타입 변경
    await queryInterface.sequelize.query(`
      ALTER TABLE writing_records 
      MODIFY COLUMN type ENUM('correction', 'translation', 'english_to_korean') NOT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백: 원래 ENUM 타입으로 복원
    await queryInterface.sequelize.query(`
      ALTER TABLE writing_records 
      MODIFY COLUMN type ENUM('correction', 'translation') NOT NULL
    `);
  }
};

