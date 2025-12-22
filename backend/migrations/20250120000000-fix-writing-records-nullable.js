'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // writing_question_id를 nullable로 변경 (correction 타입은 질문 없이도 가능)
    await queryInterface.sequelize.query(`
      ALTER TABLE writing_records 
      MODIFY COLUMN writing_question_id INT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백: 다시 NOT NULL로 변경 (주의: 기존 NULL 값이 있으면 실패할 수 있음)
    await queryInterface.sequelize.query(`
      ALTER TABLE writing_records 
      MODIFY COLUMN writing_question_id INT NOT NULL
    `);
  }
};

