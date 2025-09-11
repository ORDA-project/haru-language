const { User } = require("../models");

const getUserIdBySocialId = async (socialId) => {
  const user = await User.findOne({ where: { social_id: socialId } });
  return user ? user.id : null;
};

const getSocialIdFromSession = (req) => {
  return req.session?.user?.social_id;
};

module.exports = {
  getUserIdBySocialId,
  getSocialIdFromSession
};