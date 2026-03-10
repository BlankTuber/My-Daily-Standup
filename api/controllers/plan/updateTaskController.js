const DayPlan = require("../../models/DayPlan");

const updateTask = async (req, res) => {
    const userId = req.session.userId;
    const { id, taskId } = req.params;
    const { result, completedAt } = req.body;

    try {
        const plan = await DayPlan.findOne({ _id: id, userId });
        if (!plan) return res.status(404).json({ error: "Plan not found" });
        if (plan.status !== "active") return res.status(400).json({ error: "Plan is not active" });

        const task = plan.tasks.id(taskId);
        if (!task) return res.status(404).json({ error: "Task not found" });

        if (result) task.result = { ...task.result, ...result };
        if (completedAt) task.completedAt = completedAt;

        await plan.save();
        return res.status(200).json(task);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = updateTask;
