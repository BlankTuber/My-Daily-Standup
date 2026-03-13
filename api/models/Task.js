const { Schema } = require("mongoose");

const taskSchema = new Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ["checkbox", "timer", "counter", "timed_counter", "note", "rating"],
        required: true
    },
    config: {
        targetMinutes: { type: Number, min: 1 },
        targetCount: { type: Number, min: 1 },
        maxRating: { type: Number, min: 2, max: 10 },
    },
    result: {
        completed: { type: Boolean },
        actualMinutes: { type: Number },
        actualCount: { type: Number },
        rating: { type: Number },
        note: { type: String },
    },
    completedAt: { type: Date }
});

taskSchema.pre("validate", function () {
    switch (this.type) {
        case "timer":
            if (!this.config?.targetMinutes) throw new Error("Timer tasks require targetMinutes");
            break;
        case "counter":
            if (!this.config?.targetCount) throw new Error("Counter tasks require targetCount");
            break;
        case "timed_counter":
            if (!this.config?.targetMinutes) throw new Error("Timed counter tasks require targetMinutes");
            if (!this.config?.targetCount) throw new Error("Timed counter tasks require targetCount");
            break;
        case "rating":
            if (!this.config?.maxRating) throw new Error("Rating tasks require maxRating");
            break;
    }
});

module.exports = taskSchema;
