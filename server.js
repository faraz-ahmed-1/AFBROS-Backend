const express = require("express");
const cors = require("cors");
require("dotenv").config();
console.log("Backend:", process.env.DB_HOST);
require("./config/db");
const app = express();
const createTables = require("./database/initDB");
app.use(cors());
app.use(express.json());
const donationRoutes = require("./routes/donationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/expenses", expenseRoutes);
app.get("/", (req, res) => {
    res.send("AFBROS Backend Running...");
});

createTables();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});