const express = require("express");
const router = express.Router();
const DayPlan = require("../models/DayPlan");
const User = require("../models/User");
const getLocalDate = require("../utils/getLocalDate");
const requireAuth = require("../middleware/isAuthView");

const redirectIfAuth = (req, res, next) => {
    if (req.session.userId) return res.redirect("/today");
    next();
};

router.get("/", (req, res) =>
    res.redirect(req.session.userId ? "/today" : "/login")
);

router.get("/login", redirectIfAuth, (req, res) => {
    res.render("pages/login", {
        title: "Login",
        currentPage: null,
        pageStyle: "auth",
        pageScript: "auth",
        bodyClass: "no-nav",
    });
});

router.get("/register", redirectIfAuth, (req, res) => {
    res.render("pages/register", {
        title: "Register",
        currentPage: null,
        pageStyle: "auth",
        pageScript: "auth",
        bodyClass: "no-nav",
    });
});

router.get("/today", requireAuth, async (req, res) => {
    try {
        const today = await getLocalDate(req.session.userId);
        const raw = await DayPlan.findOne({ userId: req.session.userId, date: today });
        const plan = raw ? JSON.parse(JSON.stringify(raw)) : null;

        res.render("pages/today", {
            title: "Today",
            currentPage: "today",
            pageStyle: "today",
            pageScript: "today",
            bodyClass: null,
            plan,
        });
    } catch (err) {
        console.error(err);
        res.render("pages/today", {
            title: "Today",
            currentPage: "today",
            pageStyle: "today",
            pageScript: "today",
            bodyClass: null,
            plan: null,
        });
    }
});

router.get("/history", requireAuth, (req, res) => {
    res.render("pages/history", {
        title: "History",
        currentPage: "history",
        pageStyle: "history",
        pageScript: "history",
        bodyClass: null,
    });
});

router.get("/settings", requireAuth, async (req, res) => {
    try {
        const raw = await User.findById(req.session.userId).select("username timezoneOffset");

        if (!raw) {
            req.session.destroy(() => { });
            res.clearCookie("connect.sid");
            return res.redirect("/login");
        }

        const user = JSON.parse(JSON.stringify(raw));

        res.render("pages/settings", {
            title: "Settings",
            currentPage: "settings",
            pageStyle: "settings",
            pageScript: "settings",
            bodyClass: null,
            user,
        });
    } catch (err) {
        console.error(err);
        res.redirect("/today");
    }
});

module.exports = router;
