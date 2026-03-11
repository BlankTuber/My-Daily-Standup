const { Schema, model } = require("mongoose");
const argon2 = require("argon2");

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    timezoneOffset: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await argon2.hash(this.password);
});

userSchema.methods.verifyPassword = async function (plaintext) {
    return argon2.verify(this.password, plaintext);
};

const User = model("User", userSchema);
module.exports = User;
