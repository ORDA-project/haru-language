'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('examples', 'images', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: '예문 생성에 사용된 이미지 URL 배열 (원본 + 추가 이미지들)'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('examples', 'images');
  }
};

