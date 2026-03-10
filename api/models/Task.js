const { Schema } = require("mongoose");

const taskSchema = new Schema({
    title: { type: String, required: true },
    type: {
        type: String,
        enum: ["checkbox", "timer", "counter", "timed_counter", "note", "rating"],
        required: true
    },
    config: {
        targetMinutes: { type: Number },    // timer, timed_counter
        targetCount: { type: Number },      // counter, timed_counter
        maxRating: { type: Number },        // rating
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

module.exports = taskSchema;
