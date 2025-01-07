'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("user_activities", {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER,
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "users", // 연결된 테이블 이름
                    key: "id",
                },
                onUpdate: "CASCADE", // 사용자의 데이터가 업데이트되면 동기화
                onDelete: "CASCADE", // 사용자가 삭제되면 관련 데이터도 삭제
            },
            visit_count: {
                type: Sequelize.INTEGER,
                defaultValue: 0,
            },
            most_visited_day: {
                type: Sequelize.STRING,
            },
            sunday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            monday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            tuesday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            wednesday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            thursday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            friday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            saturday_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable("user_activities");
    },
};
