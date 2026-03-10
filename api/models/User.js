const { Schema, model } = require("mongoose");
const argon2 = require("argon2");

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await argon2.hash(this.password);
    next();
});

userSchema.methods.verifyPassword = async function (plaintext) {
    return argon2.verify(this.password, plaintext);
};

const User = model("User", userSchema);
module.exports = User;
