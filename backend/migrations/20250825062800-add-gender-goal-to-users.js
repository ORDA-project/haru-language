'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'users';
    const desc = await queryInterface.describeTable(table);

    if (!desc.gender) {
      await queryInterface.addColumn(table, 'gender', {
        type: Sequelize.ENUM('male', 'female', 'private'),
        allowNull: true,
      });
    }

    if (!desc.goal) {
      await queryInterface.addColumn(table, 'goal', {
        type: Sequelize.ENUM('hobby', 'exam', 'business', 'travel'),
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'users';
    const desc = await queryInterface.describeTable(table);

    if (desc.goal)   await queryInterface.removeColumn(table, 'goal');
    if (desc.gender) await queryInterface.removeColumn(table, 'gender');
  }
};
