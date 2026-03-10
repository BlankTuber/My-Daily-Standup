const PushSubscription = require("../../models/PushSubscription");

const unsubscribe = async (req, res) => {
    const userId = req.session.userId;

    try {
        await PushSubscription.findOneAndDelete({ userId });
        return res.status(200).json({ message: "Unsubscribed from push notifications" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = unsubscribe;
