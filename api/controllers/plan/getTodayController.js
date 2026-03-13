const DayPlan = require("../../models/DayPlan");
const getLocalDate = require("../../utils/getLocalDate");

const getToday = async (req, res) => {
    const userId = req.session.userId;

    try {
        const today = await getLocalDate(userId);
        const plan = await DayPlan.findOne({ userId, date: today });
        if (!plan) return res.status(404).json({ error: "No plan for today" });
        return res.status(200).json(plan);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = getToday;
