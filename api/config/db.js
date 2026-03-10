const mongoose = require("mongoose");

const connectDB = () => {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/my-daily-standup";
    mongoose.connect(uri)
        .then(() => console.log("✅ Connected to database"))
        .catch(err => console.error("❌ Connection error: ", err));
};

module.exports = connectDB;
