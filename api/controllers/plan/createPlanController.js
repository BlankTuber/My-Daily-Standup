const DayPlan = require("../../models/DayPlan");

const createPlan = async (req, res) => {
    const userId = req.session.userId;
    const today = new Date().toISOString().split("T")[0];
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "At least one task is required" });
    }

    try {
        const existing = await DayPlan.findOne({ userId, date: today });
        if (existing) return res.status(409).json({ error: "A plan for today already exists" });

        const plan = await DayPlan.create({ userId, date: today, tasks, status: "active" });
        return res.status(201).json(plan);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = createPlan;
