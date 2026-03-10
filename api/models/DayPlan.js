const { Schema, model } = require("mongoose");
const taskSchema = require("./Task");

const dayPlanSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    status: {
        type: String,
        enum: ["draft", "active", "completed"],
        default: "draft"
    },
    tasks: [taskSchema],
    summary: { type: String },
    reflection: { type: String }
}, { timestamps: true });

dayPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

const DayPlan = model("DayPlan", dayPlanSchema);

module.exports = DayPlan;
