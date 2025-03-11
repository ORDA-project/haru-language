const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Invitation = sequelize.define("Invitation", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    inviter_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    invitee_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true  // ✅ 중복 방지를 위해 고유값 설정
    },
    status: {
        type: DataTypes.ENUM("pending", "accepted", "rejected"),
        defaultValue: "pending"
    }
}, {
    tableName: "invitations",  // ✅ 테이블 이름 유지
    timestamps: true,
    underscored: true
});

module.exports = Invitation;
