require("dotenv").config();

const express =
    require("express");

const cors =
    require("cors");


const app =
    express();


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors()
);


app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended:
            true
    })
);


// ======================================================
// ROUTES
// ======================================================

const authRoutes =
    require(
        "./routes/authRoutes"
    );


const donationRoutes =
    require(
        "./routes/donationRoutes"
    );


const expenseRoutes =
    require(
        "./routes/expenseRoutes"
    );


const dashboardRoutes =
    require(
        "./routes/dashboardRoutes"
    );


const reportRoutes =
    require(
        "./routes/reportRoutes"
    );


const donorProfileRoutes =
    require(
        "./routes/donorProfileRoutes"
    );


// ======================================================
// USE ROUTES
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/dashboard",
    dashboardRoutes
);


app.use(
    "/api/donations",
    donationRoutes
);


app.use(
    "/api/expenses",
    expenseRoutes
);


app.use(
    "/api/reports",
    reportRoutes
);


app.use(
    "/api/donor-profile",
    donorProfileRoutes
);


// ======================================================
// HEALTH CHECK
// ======================================================

app.get(
    "/api/health",
    (
        req,
        res
    ) => {

        res
            .status(200)
            .json({

                success:
                    true,

                message:
                    "AFBROS API is running."

            });

    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (
        req,
        res
    ) => {

        res
            .status(404)
            .json({
                message:
                    "API route not found."
            });

    }
);


// ======================================================
// SERVER
// ======================================================

const PORT =
    process.env.PORT ||
    5000;


app.listen(
    PORT,
    () => {

        console.log(
            `AFBROS server running on port ${PORT}`
        );

    }
);