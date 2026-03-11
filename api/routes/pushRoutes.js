const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/isAuth");

const subscribe = require("../controllers/push/subscribeController");
const unsubscribe = require("../controllers/push/unsubscribeController");

router.use(isAuth);

router.post("/subscribe", subscribe);
router.delete("/unsubscribe", unsubscribe);
router.get("/vapid-public-key", (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) return res.status(500).json({ error: "VAPID not configured" });
    return res.json({ publicKey: key });
});

module.exports = router;
