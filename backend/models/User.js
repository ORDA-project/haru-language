'use strict';

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define(
        'User',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            social_id: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            social_provider: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            tableName: 'users',
            timestamps: true, // createdAt과 updatedAt 자동 생성
        }
    );

    User.associate = (models) => {
        User.hasMany(models.UserActivity, {
            foreignKey: 'user_id',
            as: 'activities', // 관계 이름
        });
    };

    return User;
};
