const DayPlan = require("../../models/DayPlan");

const activatePlan = async (req, res) => {
    const userId = req.session.userId;
    const { id } = req.params;

    try {
        const plan = await DayPlan.findOne({ _id: id, userId });
        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.status !== "draft") return res.status(400).json({ error: "Plan is already active or completed" });

        plan.status = "active";
        await plan.save();
        return res.status(200).json(plan);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = activatePlan;
