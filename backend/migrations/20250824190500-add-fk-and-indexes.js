'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (qi) => {
    const add = async (table, opts) => { try { await qi.addConstraint(table, opts); } catch (e) {} };
    const addIndex = async (table, fields, name, unique=false) => {
      try { await qi.addIndex(table, { fields, name, unique }); } catch (e) {}
    };

    // user_books → users
    await add('user_books', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_books_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    // user_interests → users
    await add('user_interests', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_interests_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    // writing_examples → writing_questions
    await add('writing_examples', {
      fields: ['writing_question_id'],
      type: 'foreign key',
      name: 'fk_writing_examples_question',
      references: { table: 'writing_questions', field: 'id' },
      onDelete: 'CASCADE',
    });

    // writing_records → users / writing_questions
    await add('writing_records', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_writing_records_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
    await add('writing_records', {
      fields: ['writing_question_id'],
      type: 'foreign key',
      name: 'fk_writing_records_question',
      references: { table: 'writing_questions', field: 'id' },
      onDelete: 'CASCADE',
    });

    // invitations → users (inviter/ invitee)
    await add('invitations', {
      fields: ['inviter_id'],
      type: 'foreign key',
      name: 'fk_invitations_inviter',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
    await add('invitations', {
      fields: ['invitee_id'],
      type: 'foreign key',
      name: 'fk_invitations_invitee',
      references: { table: 'users', field: 'id' },
      onDelete: 'SET NULL',
    });

    // friends → users + UNIQUE(user, friend)
    await add('friends', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_friends_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
    await add('friends', {
      fields: ['friend_id'],
      type: 'foreign key',
      name: 'fk_friends_friend',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
    await addIndex('friends', ['user_id','friend_id'], 'uq_friends_user_friend', true);

    // examples → users
    await add('examples', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_examples_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    // example_items → examples
    await add('example_items', {
      fields: ['example_id'],
      type: 'foreign key',
      name: 'fk_example_items_example',
      references: { table: 'examples', field: 'id' },
      onDelete: 'CASCADE',
    });

    // dialogues → example_items
    await add('dialogues', {
      fields: ['example_item_id'],
      type: 'foreign key',
      name: 'fk_dialogues_example_item',
      references: { table: 'example_items', field: 'id' },
      onDelete: 'CASCADE',
    });

    // notifications → users(수신/발신)
    await add('notifications', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_notifications_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
    await add('notifications', {
      fields: ['sender_id'],
      type: 'foreign key',
      name: 'fk_notifications_sender',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    // questions → users
    await add('questions', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_questions_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });

    // answers → questions
    await add('answers', {
      fields: ['question_id'],
      type: 'foreign key',
      name: 'fk_answers_question',
      references: { table: 'questions', field: 'id' },
      onDelete: 'CASCADE',
    });

    // (보강) user_activities → users
    await add('user_activities', {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'fk_user_activities_user',
      references: { table: 'users', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  down: async (qi) => {
    const rm = async (table, name) => { try { await qi.removeConstraint(table, name); } catch (e) {} };
    const rmIdx = async (table, name) => { try { await qi.removeIndex(table, name); } catch (e) {} };

    await rmIdx('friends', 'uq_friends_user_friend');

    await rm('answers','fk_answers_question');
    await rm('questions','fk_questions_user');
    await rm('notifications','fk_notifications_sender');
    await rm('notifications','fk_notifications_user');
    await rm('dialogues','fk_dialogues_example_item');
    await rm('example_items','fk_example_items_example');
    await rm('examples','fk_examples_user');
    await rm('friends','fk_friends_friend');
    await rm('friends','fk_friends_user');
    await rm('invitations','fk_invitations_invitee');
    await rm('invitations','fk_invitations_inviter');
    await rm('writing_records','fk_writing_records_question');
    await rm('writing_records','fk_writing_records_user');
    await rm('writing_examples','fk_writing_examples_question');
    await rm('user_interests','fk_user_interests_user');
    await rm('user_books','fk_user_books_user');
    await rm('user_activities','fk_user_activities_user');
  }
};
