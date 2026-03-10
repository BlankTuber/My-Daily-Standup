const argon2 = require("argon2");
const User = require("../../models/User");

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const valid = await argon2.verify(user.password, password);
        if (!valid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.userId = user._id;
        return res.status(200).json({ message: "Logged in" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = login;
