const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/isAuth");

const subscribe = require("../controllers/push/subscribeController");
const unsubscribe = require("../controllers/push/unsubscribeController");

router.use(isAuth);

router.post("/subscribe", subscribe);
router.delete("/unsubscribe", unsubscribe);

module.exports = router;
