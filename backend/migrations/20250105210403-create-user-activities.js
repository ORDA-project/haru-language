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
                defaultValue: 1, // 처음 방문 시 방문 횟수는 1로 설정
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });

        // user_activities 테이블에 외래 키 제약 조건 추가
        await queryInterface.addConstraint('user_activities', {
            fields: ['user_id'],
            type: 'foreign key',
            name: 'fk_user_id',
            references: {
                table: 'users',
                field: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
        });
    },

    async down(queryInterface, Sequelize) {
        // 테이블 롤백 시 user_activities 테이블 삭제
        await queryInterface.dropTable("user_activities");
    },
};
