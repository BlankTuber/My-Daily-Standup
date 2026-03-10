const { Schema, model } = require("mongoose");

const pushSubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    subscription: { type: Object, required: true }
}, { timestamps: true });

const PushSubscription = model("PushSubscription", pushSubscriptionSchema);
module.exports = PushSubscription;
