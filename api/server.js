require("dotenv").config();
const path = require("path");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const connectDB = require("./config/db");
const corsOptions = require("./config/corsConfig");
const helmetOptions = require("./config/helmetConfig");
const sessionMiddleware = require("./config/sessionConfig");
const runScheduler = require("./cron/scheduler");

const app = express();
connectDB();
runScheduler();

const SUSPICIOUS_PATH = /(\.(env|git|svn|hg|htaccess|htpasswd|DS_Store|bak|backup|sql|conf|ini|log|lock|pem|key|crt|p12|pfx|ovpn)|wp-login\.php|xmlrpc\.php|\/etc\/passwd|\/proc\/self|\.\.[\\/])/i;

app.use((req, res, next) => {
    if (SUSPICIOUS_PATH.test(req.path)) {
        return res.status(404).end();
    }
    next();
});

app.use(morgan("dev", {
    skip: (req, res) => res.statusCode === 404 && !req.path.startsWith("/auth")
        && !req.path.startsWith("/plans")
        && !req.path.startsWith("/push")
        && !["/today", "/history", "/settings", "/login", "/register", "/"].includes(req.path),
}));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static assets
app.use(express.static(path.join(__dirname, "public")));

app.use(cors(corsOptions));
app.use(helmet(helmetOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(sessionMiddleware);

// API routes
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const pushRoutes = require("./routes/pushRoutes");

app.use("/auth", authRoutes);
app.use("/plans", planRoutes);
app.use("/push", pushRoutes);

const viewRoutes = require("./routes/viewRoutes");
app.use("/", viewRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
