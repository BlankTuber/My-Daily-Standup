const webpush = require("web-push");
const PushSubscription = require("../../models/PushSubscription");

const subscribe = async (req, res) => {
    const userId = req.session.userId;
    const { subscription } = req.body;

    if (!subscription) return res.status(400).json({ error: "Subscription object is required" });

    try {
        await PushSubscription.findOneAndUpdate(
            { userId },
            { subscription },
            { upsert: true, returnDocument: "after" }
        );

        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify({
                    title: "Notifications enabled! 🎉",
                    body: "You'll get a reminder at 8am to plan your day, and at 8pm to wrap up.",
                })
            );
        } catch (pushErr) {
            console.error("Welcome push failed:", pushErr.message);
        }

        return res.status(201).json({ message: "Subscribed to push notifications" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = subscribe;
