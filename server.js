const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Backend:", process.env.DB_HOST);
require("./config/db");
const app = express();
const createTables = require("./database/initDB");
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://afbros.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));
app.use(express.json());
const donationRoutes = require("./routes/donationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
    res.send("AFBROS Backend Running...");
});

createTables();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});