const DayPlan = require("../../models/DayPlan");
const getLocalDate = require("../../utils/getLocalDate");

const REQUIRED_CONFIG = {
    timer: ["targetMinutes"],
    counter: ["targetCount"],
    timed_counter: ["targetMinutes", "targetCount"],
    rating: ["maxRating"],
};

const validateTasks = (tasks) => {
    for (const task of tasks) {
        if (!task.title || !task.title.trim()) return "Each task must have a title";
        const required = REQUIRED_CONFIG[task.type];
        if (required) {
            for (const field of required) {
                const val = task.config?.[field];
                if (!val || isNaN(val) || Number(val) < 1) {
                    return `Task "${task.title}" is missing a valid ${field}`;
                }
            }
        }
    }
    return null;
};

const createPlan = async (req, res) => {
    const userId = req.session.userId;
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: "At least one task is required" });
    }

    const validationError = validateTasks(tasks);
    if (validationError) return res.status(400).json({ error: validationError });

    try {
        const today = await getLocalDate(userId);
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
