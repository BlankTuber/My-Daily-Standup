const DayPlan = require("../../models/DayPlan");
const computeSummary = require("../../utils/computeSummary");

const completePlan = async (req, res) => {
    const userId = req.session.userId;
    const { id } = req.params;
    const { reflection } = req.body;

    try {
        const plan = await DayPlan.findOne({ _id: id, userId });
        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.status !== "active") return res.status(400).json({ error: "Plan is not active" });

        plan.status = "completed";
        plan.summary = computeSummary(plan.tasks);
        if (reflection) plan.reflection = reflection;

        await plan.save();
        return res.status(200).json(plan);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = completePlan;
