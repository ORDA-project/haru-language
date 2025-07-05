const { DataTypes, Op } = require("sequelize");
const sequelize = require("../db");

const UserActivity = sequelize.define("UserActivity", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    visit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
    }
}, {
    tableName: "user_activities",
    timestamps: true,
    underscored: true, 
});

// 방문 횟수 업데이트 (하루 00:00 기준)
UserActivity.updateVisit = async function (user_id) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 00:00 기준

    const lastActivity = await UserActivity.findOne({
        where: { user_id },
        order: [["createdAt", "DESC"]], 
    });

    if (lastActivity) {
        const lastVisitDate = new Date(lastActivity.createdAt);
        lastVisitDate.setHours(0, 0, 0, 0); 

        if (lastVisitDate.toDateString() === today.toDateString()) {
            console.log(`같은 날 방문: visit_count 유지 (${lastActivity.visit_count})`);
            return lastActivity;
        }

        const newVisit = await UserActivity.create({
            user_id,
            visit_count: lastActivity.visit_count + 1, // 기존 visit_count +1
        });
        console.log(`다음 날 방문: visit_count 증가 (${newVisit.visit_count})`);
        return newVisit;
    }

    const firstVisit = await UserActivity.create({
        user_id,
        visit_count: 1,
    });
    console.log("첫 로그인: visit_count = 1");
    return firstVisit;
};

// 사용자가 가장 많이 방문한 요일 계산
UserActivity.getMostVisitedDays = async function (user_id) {
    const activities = await UserActivity.findAll({
        where: { user_id },
        attributes: ["createdAt"], 
    });

    const dayCounts = activities.reduce((counts, activity) => {
        const visitDate = new Date(activity.createdAt); 
        const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Seoul" });
        const day = formatter.format(visitDate);

        counts[day] = (counts[day] || 0) + 1;
        return counts;
    }, {});

    console.log("요일별 방문 횟수:", dayCounts);

    const maxVisits = Math.max(...Object.values(dayCounts)); // 가장 높은 방문 횟수
    const mostVisitedDays = Object.keys(dayCounts).filter(day => dayCounts[day] === maxVisits);

    return {
        mostVisitedDays,
        visitCounts: dayCounts,
    };
};

// 특정 요일의 방문 횟수 계산
UserActivity.getDayCount = async function (user_id, day) {
    const activities = await UserActivity.findAll({
        where: { user_id },
        attributes: ["createdAt"], 
    });

    return activities.reduce((count, activity) => {
        const visitDate = new Date(activity.createdAt); 
        const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Seoul" });
        const activityDay = formatter.format(visitDate);

        return activityDay === day ? count + 1 : count;
    }, 0);
};

module.exports = UserActivity;
