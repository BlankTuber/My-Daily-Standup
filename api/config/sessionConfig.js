const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const sessionStore = MongoStore.create({
    mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/my-daily-standup",
    collectionName: "sessions"
});

const sessionCookie = {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};

module.exports = session({
    secret: process.env.SESSION_SECRET || "superSecretString",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: sessionCookie
});
