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
// VALID DATE FORMAT
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
        date.getUTCFullYear() ===
            year &&

        date.getUTCMonth() ===
            month - 1 &&

        date.getUTCDate() ===
            day
    );

};


// ======================================================
// GET PDF STATEMENT DATA
// ======================================================

const getStatement = async (
    req,
    res
) => {

    try {

        const type =
            req.query.type ||
            "all";


        const from =
            req.query.from ||
            "";


        const to =
            req.query.to ||
            "";


        const donor =
            req.query.donor
                ?.trim() ||
            "";


        // ==============================================
        // VALIDATE TYPE
        // ==============================================

        if (
            ![
                "all",
                "in",
                "out"
            ].includes(type)
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid statement type."
                });

        }


        // ==============================================
        // VALIDATE DATE RANGE
        // ==============================================

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


        // ==============================================
        // DONATION CONDITIONS
        // ==============================================

        let donationWhere =
            `
                WHERE donation_date
                <= CURDATE()
            `;


        let donationParams =
            [];


        if (
            hasFrom &&
            hasTo
        ) {

            donationWhere = `

                WHERE donation_date
                BETWEEN ? AND ?

            `;


            donationParams = [
                from,
                to
            ];

        }


        // ==============================================
        // OPTIONAL DONOR FILTER
        // ==============================================
        //
        // Applies only to donations.
        //
        // Complete Statement:
        // filters credit/donation entries,
        // while expenses remain present.
        //
        // Donation Statement:
        // filters donation entries.
        //
        // Expense Statement:
        // ignored.
        // ==============================================

        if (
            donor &&
            (
                type === "all" ||
                type === "in"
            )
        ) {

            donationWhere += `

                AND full_name LIKE ?

            `;


            donationParams.push(
                `%${donor}%`
            );

        }


        // ==============================================
        // EXPENSE CONDITIONS
        // ==============================================

        let expenseWhere =
            `
                WHERE expense_date
                <= CURDATE()
            `;


        let expenseParams =
            [];


        if (
            hasFrom &&
            hasTo
        ) {

            expenseWhere = `

                WHERE expense_date
                BETWEEN ? AND ?

            `;


            expenseParams = [
                from,
                to
            ];

        }


        // ==============================================
        // DONATION QUERY
        // ==============================================

        const donationSql = `

            SELECT

                id,

                DATE_FORMAT(
                    donation_date,
                    '%Y-%m-%d'
                ) AS record_date,

                'IN'
                    AS transaction_type,

                full_name,

                phone
                    AS details,

                amount

            FROM donations

            ${donationWhere}

            ORDER BY
                donation_date ASC,
                id ASC

        `;


        // ==============================================
        // EXPENSE QUERY
        // ==============================================

        const expenseSql = `

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


        // ==============================================
        // LOAD REQUIRED DATA
        // ==============================================

        let donations =
            [];


        let expenses =
            [];


        if (
            type === "all" ||
            type === "in"
        ) {

            donations =
                await queryAsync(
                    donationSql,
                    donationParams
                );

        }


        if (
            type === "all" ||
            type === "out"
        ) {

            expenses =
                await queryAsync(
                    expenseSql,
                    expenseParams
                );

        }


        // ==============================================
        // COMBINE RECORDS
        // ==============================================

        const records = [
            ...donations,
            ...expenses
        ];


        // ==============================================
        // SORT BY DATE
        // ==============================================

        records.sort(
            (a, b) => {

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


                // Credit before debit
                // on same date.

                return (
                    a.transaction_type ===
                    "IN"
                        ? -1
                        : 1
                );

            }
        );


        // ==============================================
        // TOTAL CREDIT
        // ==============================================

        const totalIn =
            donations.reduce(
                (
                    sum,
                    donation
                ) => {

                    return (
                        sum +
                        Number(
                            donation.amount
                        )
                    );

                },
                0
            );


        // ==============================================
        // TOTAL DEBIT
        // ==============================================

        const totalOut =
            expenses.reduce(
                (
                    sum,
                    expense
                ) => {

                    return (
                        sum +
                        Number(
                            expense.amount
                        )
                    );

                },
                0
            );


        // ==============================================
        // BALANCE
        // ==============================================

        const balance =
            totalIn -
            totalOut;


        // ==============================================
        // RESPONSE
        // ==============================================

        return res
            .status(200)
            .json({

                success:
                    true,


                type,


                filters: {

                    donor:
                        donor ||
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