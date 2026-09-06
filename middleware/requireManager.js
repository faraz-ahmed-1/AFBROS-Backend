const jwt =
    require("jsonwebtoken");


const requireManager = (
    req,
    res,
    next
) => {

    try {

        const authHeader =
            req.headers.authorization;


        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({
                message:
                    "Finance Manager login required."
            });

        }


        const token =
            authHeader.split(" ")[1];


        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        req.user =
            decoded;


        next();

    } catch (err) {

        console.error(
            "AUTH ERROR:",
            err.message
        );


        return res.status(401).json({
            message:
                "Session expired or invalid. Please login again."
        });

    }

};


module.exports =
    requireManager;