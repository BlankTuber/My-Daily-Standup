const User = require("../models/User");

const getLocalDate = async (userId) => {
    const user = await User.findById(userId).select("timezoneOffset");
    const offset = user ? (user.timezoneOffset || 0) : 0;
    const now = new Date();
    const localMs = now.getTime() + offset * 60 * 60 * 1000;
    return new Date(localMs).toISOString().split("T")[0];
};

module.exports = getLocalDate;
