'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users'); // 테이블 삭제
  },
};
