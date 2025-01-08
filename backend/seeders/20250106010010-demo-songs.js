'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      'songs',
      [
        {
          title: 'Shape of You',
          artist: 'Ed Sheeran',
          genre: 'Pop',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: 'Blinding Lights',
          artist: 'The Weeknd',
          genre: 'Pop',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: 'Bohemian Rhapsody',
          artist: 'Queen',
          genre: 'Rock',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('songs', null, {});
  },
};
