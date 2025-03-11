const { User, UserInterest, UserBook } = require("../models");

const userService = {
    // 사용자 정보 조회
    getUserInfo: async (userId) => {
        if (!userId) throw new Error("로그인이 필요합니다.");

        const user = await User.findOne({
            where: { id: userId }, 
            include: [UserInterest, UserBook]
        });

        if (!user) throw new Error("사용자 정보를 찾을 수 없습니다.");

        return {
            gender: user.gender,
            goal: user.goal,
            interests: user.UserInterests.map(i => i.interest),
            books: user.UserBooks.map(b => b.book)
        };
    },

    // 최초 사용자 정보 저장
    createUserInfo: async (userId, { gender, goal, interests, books }) => {
        if (!userId) throw new Error("로그인이 필요합니다.");

        const existingUser = await User.findOne({ where: { id: userId } });

        if (existingUser) throw new Error("이미 사용자 정보가 존재합니다.");

        await User.create({ id: userId, gender, goal });

        if (interests && Array.isArray(interests)) {
            await UserInterest.bulkCreate(interests.map(interest => ({ user_id: userId, interest }))); 
        }

        if (books && Array.isArray(books)) {
            await UserBook.bulkCreate(books.map(book => ({ user_id: userId, book }))); 
        }

        return { message: "사용자 정보가 성공적으로 저장되었습니다!" };
    },

    // 기존 사용자 정보 수정
    updateUserInfo: async (userId, { gender, goal, interests, books }) => {
        if (!userId) throw new Error("로그인이 필요합니다.");

        const existingUser = await User.findOne({ where: { id: userId } });

        if (!existingUser) throw new Error("사용자 정보가 존재하지 않습니다. 먼저 정보를 저장하세요.");

        await User.update({ gender, goal }, { where: { id: userId } });

        if (interests && Array.isArray(interests)) {
            await UserInterest.destroy({ where: { user_id: userId } }); 
            await UserInterest.bulkCreate(interests.map(interest => ({ user_id: userId, interest })));
        }

        if (books && Array.isArray(books)) {
            await UserBook.destroy({ where: { user_id: userId } }); 
            await UserBook.bulkCreate(books.map(book => ({ user_id: userId, book })));
        }

        return { message: "사용자 정보가 성공적으로 수정되었습니다!" };
    }
};

module.exports = userService;
