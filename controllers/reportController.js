const db = require("../config/db");


// ======================================================
// QUERY HELPER
// ======================================================

const queryAsync = (
    sql,
    params = []
) => {

    return new Promise(
        (resolve, reject) => {

            db.query(
                sql,
                params,
                (err, result) => {

                    if (err) {

                        reject(err);

                        return;
                    }

                    resolve(result);
                }
            );

        }
    );

};


// ======================================================
// VALID DATE
// ======================================================

const isValidDateString = (
    value
) => {

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            value
        )
    ) {

        return false;

    }


    const [
        year,
        month,
        day
    ] = value
        .split("-")
        .map(Number);


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );

};


// ======================================================
// GET STATEMENT
// ======================================================

const getStatement = async (
    req,
    res
) => {

    try {

        const requestedType =
            req.query.type ||
            "all";


        const from =
            req.query.from?.trim() ||
            "";


        const to =
            req.query.to?.trim() ||
            "";


        let donor =
            req.query.donor?.trim() ||
            "";


        // ==================================================
        // VALIDATE TYPE
        // ==================================================

        if (
            ![
                "all",
                "in",
                "out"
            ].includes(
                requestedType
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid statement type."
                });

        }


        // ==================================================
        // EXPENSE DOES NOT USE DONOR
        // ==================================================

        if (
            requestedType ===
            "out"
        ) {

            donor = "";

        }


        // ==================================================
        // DATE VALIDATION
        // ==================================================

        const hasFrom =
            Boolean(from);


        const hasTo =
            Boolean(to);


        if (
            hasFrom !==
            hasTo
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Both From and To dates are required."
                });

        }


        if (
            hasFrom &&
            (
                !isValidDateString(
                    from
                ) ||
                !isValidDateString(
                    to
                )
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid statement date."
                });

        }


        if (
            hasFrom &&
            from > to
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "From date cannot be after To date."
                });

        }


        // ==================================================
        // VALIDATE DONOR
        // ==================================================

        let canonicalDonorName =
            "";


        if (
            donor &&
            (
                requestedType === "all" ||
                requestedType === "in"
            )
        ) {

            const donorRows =
                await queryAsync(
                    `

                        SELECT DISTINCT
                            TRIM(full_name)
                                AS full_name

                        FROM donations

                        WHERE
                            LOWER(
                                TRIM(full_name)
                            ) =
                            LOWER(
                                TRIM(?)
                            )

                        LIMIT 1

                    `,
                    [
                        donor
                    ]
                );


            if (
                donorRows.length === 0
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Donor was not found in donation records. Please select a donor from the suggestions."
                    });

            }


            /*
                IMPORTANT FIX:

                Always normalize the database
                donor name before reusing it.
            */

            canonicalDonorName =
                String(
                    donorRows[0]
                        .full_name ||
                    ""
                ).trim();

        }


        // ==================================================
        // STATEMENT TYPE
        // ==================================================
        //
        // Complete + selected donor
        // becomes Donation Statement.
        // ==================================================

        let statementType =
            requestedType;


        if (
            requestedType === "all" &&
            canonicalDonorName
        ) {

            statementType =
                "in";

        }


        // ==================================================
        // DONATION WHERE
        // ==================================================

        let donationWhere =
            `

                WHERE
                    donation_date <= CURDATE()

            `;


        let donationParams =
            [];


        if (
            hasFrom &&
            hasTo
        ) {

            donationWhere =
                `

                    WHERE
                        donation_date
                        BETWEEN ? AND ?

                `;


            donationParams = [
                from,
                to
            ];

        }


        // ==================================================
        // DONOR FILTER
        // ==================================================

        if (
            canonicalDonorName
        ) {

            donationWhere +=
                `

                    AND
                        LOWER(
                            TRIM(full_name)
                        ) =
                        LOWER(
                            TRIM(?)
                        )

                `;


            donationParams.push(
                canonicalDonorName
            );

        }


        // ==================================================
        // EXPENSE WHERE
        // ==================================================

        let expenseWhere =
            `

                WHERE
                    expense_date <= CURDATE()

            `;


        let expenseParams =
            [];


        if (
            hasFrom &&
            hasTo
        ) {

            expenseWhere =
                `

                    WHERE
                        expense_date
                        BETWEEN ? AND ?

                `;


            expenseParams = [
                from,
                to
            ];

        }


        // ==================================================
        // DONATION QUERY
        // ==================================================

        const donationSql =
            `

                SELECT

                    id,

                    DATE_FORMAT(
                        donation_date,
                        '%Y-%m-%d'
                    ) AS record_date,

                    'IN'
                        AS transaction_type,

                    TRIM(full_name)
                        AS full_name,

                    TRIM(phone)
                        AS details,

                    amount

                FROM donations

                ${donationWhere}

                ORDER BY
                    donation_date ASC,
                    id ASC

            `;


        // ==================================================
        // EXPENSE QUERY
        // ==================================================

        const expenseSql =
            `

                SELECT

                    id,

                    DATE_FORMAT(
                        expense_date,
                        '%Y-%m-%d'
                    ) AS record_date,

                    'OUT'
                        AS transaction_type,

                    full_name,

                    description
                        AS details,

                    amount

                FROM expenses

                ${expenseWhere}

                ORDER BY
                    expense_date ASC,
                    id ASC

            `;


        // ==================================================
        // LOAD DATA
        // ==================================================

        let donations =
            [];


        let expenses =
            [];


        if (
            statementType === "all" ||
            statementType === "in"
        ) {

            donations =
                await queryAsync(
                    donationSql,
                    donationParams
                );

        }


        if (
            statementType === "all" ||
            statementType === "out"
        ) {

            expenses =
                await queryAsync(
                    expenseSql,
                    expenseParams
                );

        }


        // ==================================================
        // PREVENT EMPTY DONOR PDF
        // ==================================================

        if (
            canonicalDonorName &&
            donations.length === 0
        ) {

            return res
                .status(404)
                .json({
                    message:
                        hasFrom && hasTo
                            ? "No donations were found for this donor in the selected date range."
                            : "No donation records were found for this donor."
                });

        }


        // ==================================================
        // COMBINE RECORDS
        // ==================================================

        const records = [
            ...donations,
            ...expenses
        ];


        // ==================================================
        // SORT
        // ==================================================

        records.sort(
            (
                a,
                b
            ) => {

                const dateCompare =
                    String(
                        a.record_date
                    ).localeCompare(
                        String(
                            b.record_date
                        )
                    );


                if (
                    dateCompare !== 0
                ) {

                    return dateCompare;

                }


                if (
                    a.transaction_type ===
                    b.transaction_type
                ) {

                    return (
                        Number(a.id) -
                        Number(b.id)
                    );

                }


                return (
                    a.transaction_type ===
                    "IN"
                        ? -1
                        : 1
                );

            }
        );


        // ==================================================
        // TOTAL CREDIT
        // ==================================================

        const totalIn =
            donations.reduce(
                (
                    total,
                    donation
                ) => {

                    return (
                        total +
                        Number(
                            donation.amount ||
                            0
                        )
                    );

                },
                0
            );


        // ==================================================
        // TOTAL DEBIT
        // ==================================================

        const totalOut =
            expenses.reduce(
                (
                    total,
                    expense
                ) => {

                    return (
                        total +
                        Number(
                            expense.amount ||
                            0
                        )
                    );

                },
                0
            );


        // ==================================================
        // BALANCE
        // ==================================================

        const balance =
            totalIn -
            totalOut;


        // ==================================================
        // RESPONSE
        // ==================================================

        return res
            .status(200)
            .json({

                success:
                    true,


                type:
                    statementType,


                requestedType,


                filters: {

                    donor:
                        canonicalDonorName ||
                        null

                },


                range: {

                    from:
                        hasFrom
                            ? from
                            : null,

                    to:
                        hasTo
                            ? to
                            : null,

                    complete:
                        !hasFrom &&
                        !hasTo

                },


                totals: {

                    totalIn,

                    totalOut,

                    balance

                },


                records

            });


    } catch (err) {

        console.error(
            "GENERATE STATEMENT ERROR:",
            err
        );


        return res
            .status(500)
            .json({
                message:
                    "Unable to generate financial statement."
            });

    }

};


module.exports = {
    getStatement
};