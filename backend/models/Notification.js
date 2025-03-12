const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Notification = sequelize.define("Notification", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: { // 알림을 받은 사용자
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        onDelete: "CASCADE",
    },
    sender_id: { // 알림을 보낸 사용자 (추가)
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: "id",
        },
        onDelete: "CASCADE",
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    }
}, {
    tableName: "notifications",
    timestamps: false,
});

Notification.belongsTo(User, { foreignKey: "sender_id", as: "Sender" }); //  발신자 관계 설정
Notification.belongsTo(User, { foreignKey: "user_id", as: "Receiver" }); //  수신자 관계 설정

module.exports = Notification;
