'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (qi, Sequelize) => {
    const { INTEGER, STRING, TEXT, DATE, ENUM, BOOLEAN } = Sequelize;

    // user_books
    await qi.createTable('user_books', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER, allowNull: false },
      book: { type: STRING, allowNull: false }, // none/travel_conversation/daily_conversation/english_novel/textbook
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // user_interests
    await qi.createTable('user_interests', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER, allowNull: false },
      interest: { type: STRING, allowNull: false }, // conversation/reading/grammar/business/vocabulary
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // writing_questions
    await qi.createTable('writing_questions', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      question_text: { type: TEXT, allowNull: false },
      korean_text:   { type: TEXT, allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // writing_examples
    await qi.createTable('writing_examples', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      writing_question_id: { type: INTEGER, allowNull: false },
      example:     { type: TEXT, allowNull: false },
      translation: { type: TEXT, allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // writing_records
    await qi.createTable('writing_records', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER, allowNull: false },
      writing_question_id: { type: INTEGER, allowNull: false },
      original_text:  { type: TEXT, allowNull: false },
      processed_text: { type: TEXT, allowNull: false },
      feedback:       { type: TEXT },
      type: { type: ENUM('correction', 'translation'), allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // invitations
    await qi.createTable('invitations', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      inviter_id: { type: INTEGER, allowNull: false },
      invitee_id: { type: INTEGER, allowNull: true },
      token:      { type: STRING, allowNull: false, unique: true },
      status:     { type: ENUM('pending', 'accepted', 'rejected'), allowNull: false, defaultValue: 'pending' },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // friends
    await qi.createTable('friends', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id:   { type: INTEGER, allowNull: false },
      friend_id: { type: INTEGER, allowNull: false },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // examples
    await qi.createTable('examples', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER, allowNull: false },
      extracted_sentence: { type: TEXT, allowNull: false },
      description:        { type: TEXT },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // example_items
    await qi.createTable('example_items', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      example_id: { type: INTEGER, allowNull: false },
      context:    { type: TEXT, allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // dialogues
    await qi.createTable('dialogues', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      example_item_id: { type: INTEGER, allowNull: false },
      speaker: { type: STRING(1), allowNull: false }, // 'A' or 'B'
      english: { type: TEXT, allowNull: false },
      korean:  { type: TEXT, allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // notifications
    await qi.createTable('notifications', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id:   { type: INTEGER, allowNull: false },
      sender_id: { type: INTEGER, allowNull: false },
      message:   { type: STRING, allowNull: false },
      is_read:   { type: BOOLEAN, allowNull: false, defaultValue: false },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // questions
    await qi.createTable('questions', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: INTEGER, allowNull: false },
      content: { type: TEXT, allowNull: false },
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });

    // answers
    await qi.createTable('answers', {
      id: { type: INTEGER, primaryKey: true, autoIncrement: true },
      question_id: { type: INTEGER, allowNull: false },
      content:     { type: TEXT, allowNull: false },
      created_at:  { type: DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    }, { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' });
  },

  down: async (qi) => {
    await qi.dropTable('answers');
    await qi.dropTable('questions');
    await qi.dropTable('notifications');
    await qi.dropTable('dialogues');
    await qi.dropTable('example_items');
    await qi.dropTable('examples');
    await qi.dropTable('friends');
    await qi.dropTable('invitations');
    await qi.dropTable('writing_records');
    await qi.dropTable('writing_examples');
    await qi.dropTable('writing_questions');
    await qi.dropTable('user_interests');
    await qi.dropTable('user_books');
  }
};
