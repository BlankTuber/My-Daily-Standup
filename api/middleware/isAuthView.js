const User = require("../models/User");

module.exports = async (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login");
    }

    try {
        const exists = await User.exists({ _id: req.session.userId });
        if (!exists) {
            req.session.destroy(() => { });
            res.clearCookie("connect.sid");
            return res.redirect("/login");
        }
        next();
    } catch {
        return res.redirect("/login");
    }
};
