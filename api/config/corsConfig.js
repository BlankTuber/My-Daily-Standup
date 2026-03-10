const corsOptions = {
    origin: process.env.ORIGIN || "http://localhost:3000",
    methods: "GET,PUT,POST,DELETE",
    credentials: true
};

module.exports = corsOptions;
