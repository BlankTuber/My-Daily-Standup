const User = require("../../models/User");
const DayPlan = require("../../models/DayPlan");
const PushSubscription = require("../../models/PushSubscription");

const deleteAccount = async (req, res) => {
    const userId = req.session.userId;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({ error: "Password is required to delete your account" });
    }

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const valid = await user.verifyPassword(password);
        if (!valid) return res.status(401).json({ error: "Incorrect password" });

        // Clean up all user data
        await Promise.all([
            DayPlan.deleteMany({ userId }),
            PushSubscription.findOneAndDelete({ userId }),
        ]);
        await User.findByIdAndDelete(userId);

        req.session.destroy(() => {
            res.clearCookie("connect.sid");
            return res.status(200).json({ message: "Account deleted" });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = deleteAccount;
