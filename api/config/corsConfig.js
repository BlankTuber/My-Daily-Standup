const corsOptions = {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    maxAge: 86400,
};

module.exports = corsOptions;
