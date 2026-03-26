const cron = require("node-cron");
const webpush = require("web-push");
const User = require("../models/User");
const DayPlan = require("../models/DayPlan");
const PushSubscription = require("../models/PushSubscription");
const computeSummary = require("../utils/computeSummary");

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

const getLocalHour = (utcNow, offsetHours) => {
    const localMs = utcNow.getTime() + offsetHours * 60 * 60 * 1000;
    return new Date(localMs).getUTCHours();
};

const getLocalDateString = (utcNow, offsetHours) => {
    const localMs = utcNow.getTime() + offsetHours * 60 * 60 * 1000;
    return new Date(localMs).toISOString().split("T")[0];
};

const sendNotification = async (userId, payload) => {
    const sub = await PushSubscription.findOne({ userId });
    if (!sub) return;

    try {
        await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
    } catch (err) {
        // Subscription expired or invalid — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
            await PushSubscription.findOneAndDelete({ userId });
        } else {
            console.error("Push error for user", userId, err.message);
        }
    }
};

const runScheduler = () => {
    // Runs every hour at :00
    cron.schedule("0 * * * *", async () => {
        const now = new Date();

        try {
            const users = await User.find({}, "_id timezoneOffset");

            for (const user of users) {
                const localHour = getLocalHour(now, user.timezoneOffset);
                const localDate = getLocalDateString(now, user.timezoneOffset);

                // Midnight — auto-complete any active plans from past dates
                if (localHour === 0) {
                    const stalePlans = await DayPlan.find({ userId: user._id, date: { $lt: localDate }, status: "active" });
                    for (const plan of stalePlans) {
                        plan.status = "completed";
                        plan.summary = computeSummary(plan.tasks);
                        await plan.save();
                    }
                }

                // 8am — morning standup reminder (only if no plan exists yet today)
                if (localHour === 8) {
                    const plan = await DayPlan.findOne({ userId: user._id, date: localDate });
                    if (!plan) {
                        await sendNotification(user._id, {
                            title: "Good morning! 🌅",
                            body: "Time to set up your daily standup. What are you achieving today?"
                        });
                    }
                }

                // 8pm — evening check-in (only if plan is still active)
                if (localHour === 20) {
                    const plan = await DayPlan.findOne({ userId: user._id, date: localDate, status: "active" });
                    if (plan) {
                        await sendNotification(user._id, {
                            title: "Evening check-in 🌙",
                            body: "Have you finished everything on your standup? Don't forget to wrap up your day."
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Cron error:", err);
        }
    });

    console.log("⏰ Scheduler running");
};

module.exports = runScheduler;
