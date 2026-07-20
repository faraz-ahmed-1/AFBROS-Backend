const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = (req, res) => {

    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username=?";

    db.query(sql, [username], async (err, result) => {

        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(401).json({
                message: "Invalid Username or Password"
            });
        }

        const user = result[0];

        const match = await bcrypt.compare(
            password,
            user.password
        );

        if (!match) {
            return res.status(401).json({
                message: "Invalid Username or Password"
            });
        }
        
        const token = jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1d"
        }
    );

        res.json({
            message: "Login Successful",
            token
        });

    });

};

module.exports = {
    login
};