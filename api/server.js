require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const connectDB = require("./config/db");
const corsOptions = require("./config/corsConfig");
const sessionMiddleware = require("./config/sessionConfig");
const runScheduler = require("./cron/scheduler");

const app = express();
connectDB();
runScheduler();

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const pushRoutes = require("./routes/pushRoutes");

app.use("/auth", authRoutes);
app.use("/plans", planRoutes);
app.use("/push", pushRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
