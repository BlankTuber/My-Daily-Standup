const DayPlan = require("../../models/DayPlan");

const PAGE_SIZE = 10;

const getHistory = async (req, res) => {
    const userId = req.session.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);

    try {
        const total = await DayPlan.countDocuments({ userId, status: "completed" });
        const plans = await DayPlan.find({ userId, status: "completed" })
            .sort({ date: -1 })
            .skip((page - 1) * PAGE_SIZE)
            .limit(PAGE_SIZE)
            .select("date summary reflection tasks");

        return res.status(200).json({
            plans,
            page,
            totalPages: Math.ceil(total / PAGE_SIZE),
            total
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = getHistory;
