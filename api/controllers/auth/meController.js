const User = require("../../models/User");

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select("username timezoneOffset");
        if (!user) return res.status(404).json({ error: "User not found" });
        return res.status(200).json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const updateMe = async (req, res) => {
    const { timezoneOffset } = req.body;

    try {
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        if (timezoneOffset !== undefined) {
            const offset = parseFloat(timezoneOffset);
            if (isNaN(offset) || offset < -12 || offset > 14) {
                return res.status(400).json({ error: "Invalid timezone offset" });
            }
            user.timezoneOffset = offset;
        }

        await user.save();
        return res.status(200).json({ username: user.username, timezoneOffset: user.timezoneOffset });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { getMe, updateMe };
