const logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie("connect.sid");
        return res.status(200).json({ message: "Logged out" });
    });
};

module.exports = logout;
