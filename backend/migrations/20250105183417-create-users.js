'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      social_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true, // 소셜 로그인 ID는 고유값으로 설정
      },
      social_provider: {
        type: Sequelize.STRING,
        allowNull: false, // 소셜로그인 제공자 (구글 / 카카오)
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true, // 이름은 선택적으로 입력
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true, // 이메일은 선택적으로 입력
        unique: true, // 이메일 고유값 설정
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'private'),
        allowNull: true,
      },
      goal: {
        type: Sequelize.ENUM('hobby', 'exam', 'business', 'travel'),
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users'); // 테이블 삭제
  },
};
