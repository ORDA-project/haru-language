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
    underscored: false,
});

// 방문 횟수 업데이트 함수 (하루 00:00 기준)
UserActivity.updateVisit = async function (userId) {
    // 오늘 날짜 (00:00 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 00:00:00 기준

    // 사용자의 마지막 방문 기록 조회
    const lastActivity = await UserActivity.findOne({
        where: { user_id: userId },
        order: [["createdAt", "DESC"]], // 최신 방문 기록 조회
    });

    if (lastActivity) {
        // 마지막 방문 날짜 가져오기 (00:00 기준)
        const lastVisitDate = new Date(lastActivity.createdAt);
        lastVisitDate.setHours(0, 0, 0, 0); // 마지막 방문 날짜 00:00 기준

        // 마지막 방문 날짜와 오늘 날짜를 비교하여 문자열 형태로 비교 (타임존 이슈 방지)
        if (lastVisitDate.toDateString() === today.toDateString()) {
            console.log(`같은 날 방문: visit_count 유지 (${lastActivity.visit_count})`);
            return lastActivity;
        }

        // 새로운 날이 되면 visit_count 증가
        const newVisit = await UserActivity.create({
            user_id: userId,
            visit_count: lastActivity.visit_count + 1, // 기존 visit_count +1
        });
        console.log(`다음 날 방문: visit_count 증가 (${newVisit.visit_count})`);
        return newVisit;
    }

    // 첫 로그인이라면 visit_count = 1로 설정
    const firstVisit = await UserActivity.create({
        user_id: userId,
        visit_count: 1,
    });
    console.log("첫 로그인: visit_count = 1");
    return firstVisit;
};

// 사용자가 가장 많이 방문한 요일 계산 함수
UserActivity.getMostVisitedDays = async function (userId) {
    // 사용자의 모든 방문 기록 가져오기
    const activities = await UserActivity.findAll({
        where: { user_id: userId },
        attributes: ["createdAt"], // 방문 날짜만 가져오기
    });

    // 요일별 방문 횟수 계산
    const dayCounts = activities.reduce((counts, activity) => {
        const visitDate = new Date(activity.createdAt);
        const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Seoul" });
        const day = formatter.format(visitDate); // 한국 시간 기준으로 요일 변환

        counts[day] = (counts[day] || 0) + 1;
        return counts;
    }, {});

    console.log("요일별 방문 횟수:", dayCounts);

    // 가장 많이 방문한 요일 찾기
    const maxVisits = Math.max(...Object.values(dayCounts)); // 가장 높은 방문 횟수
    const mostVisitedDays = Object.keys(dayCounts).filter(day => dayCounts[day] === maxVisits); // 가장 많이 방문한 요일 찾기

    return {
        mostVisitedDays, // 최다 방문 요일 (여러 개 가능)
        visitCounts: dayCounts, // 요일별 방문 횟수
    };
};

// 특정 요일의 방문 횟수를 계산하는 함수
UserActivity.getDayCount = async function (userId, day) {
    // 해당 사용자의 모든 활동 기록 가져오기
    const activities = await UserActivity.findAll({
        where: { user_id: userId },
        attributes: ["createdAt"], 
    });

    // 주어진 요일 방문 횟수 계산
    return activities.reduce((count, activity) => {
        const visitDate = new Date(activity.createdAt);
        const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Seoul" });
        const activityDay = formatter.format(visitDate); // 한국 시간 기준 변환

        return activityDay === day ? count + 1 : count;
    }, 0);
};

module.exports = UserActivity;
