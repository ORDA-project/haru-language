 'use strict';

module.exports = (sequelize, DataTypes) => {
    const Song = sequelize.define(
        'Song',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            artist: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: 'songs',
            timestamps: false, // 변경 기록이 필요 없으므로 timestamps 비활성화
        }
    );

    return Song;
};

