const express = require("express");
const { rateLimit } = require("express-rate-limit");
const router = express.Router();

const register = require("../controllers/auth/registerController");
const login = require("../controllers/auth/loginController");
const logout = require("../controllers/auth/logoutController");

const limiter = rateLimit({
    windowMs: 1000 * 60 * 2,
    max: 10
})
router.use(limiter);

const isGuest = require("../middleware/isGuest");
const isAuth = require("../middleware/isAuth");

router.post("/register", isGuest, register);
router.post("/login", isGuest, login);
router.delete("/logout", isAuth, logout);

module.exports = router;
