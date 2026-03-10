const User = require("../../models/User");

const register = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(409).json({ error: "Username already taken" });
        }

        const user = await User.create({ username, password });

        req.session.userId = user._id;
        return res.status(201).json({ message: "Account created" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = register;
