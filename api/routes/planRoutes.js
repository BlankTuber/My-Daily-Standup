const express = require("express");
const router = express.Router();
const isAuth = require("../middleware/isAuth");

const getToday = require("../controllers/plan/getTodayController");
const createPlan = require("../controllers/plan/createPlanController");
const activatePlan = require("../controllers/plan/activatePlanController");
const updateTask = require("../controllers/plan/updateTaskController");
const completePlan = require("../controllers/plan/completePlanController");
const getHistory = require("../controllers/plan/historyController");

router.use(isAuth);

router.get("/today", getToday);
router.post("/", createPlan);
router.patch("/:id/activate", activatePlan);
router.patch("/:id/tasks/:taskId", updateTask);
router.patch("/:id/complete", completePlan);
router.get("/history", getHistory);

module.exports = router;
