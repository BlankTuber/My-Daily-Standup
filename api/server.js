require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

// Imports
const connectDB = require("./config/db");
const corsOptions = require("./config/corsConfig");
const sessionMiddleware = require("./config/sessionConfig");

// Initialization
const app = express();
connectDB();

// Default Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionMiddleware);

// Import Routes
const authRoutes = require("./routes/authRoutes");

// Connect Routes
app.use("/auth", authRoutes);

// Global error handlers
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
});

// Server Startup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
