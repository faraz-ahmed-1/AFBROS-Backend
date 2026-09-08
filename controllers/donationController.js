const db =
    require("../config/db");

const {

    sendDonationRequestSubmittedEmail,

    sendManagerDonationRequestEmail,

    sendDonationApprovedEmail,

    sendDonationRejectedEmail

} = require(
    "../utils/sendEmail"
);

// ======================================================
// HELPERS
// ======================================================

const queryAsync = (
    sql,
    params = []
) => {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            db.query(
                sql,
                params,
                (
                    err,
                    result
                ) => {

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


const beginTransactionAsync =
    () => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                db.beginTransaction(
                    (
                        err
                    ) => {

                        if (err) {

                            reject(err);

                            return;

                        }


                        resolve();

                    }
                );

            }
        );

    };


const commitAsync =
    () => {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                db.commit(
                    (
                        err
                    ) => {

                        if (err) {

                            reject(err);

                            return;

                        }


                        resolve();

                    }
                );

            }
        );

    };


const rollbackAsync =
    () => {

        return new Promise(
            (
                resolve
            ) => {

                db.rollback(
                    () =>
                        resolve()
                );

            }
        );

    };


const validAmount = (
    value
) => {

    const number =
        Number(value);


    return (
        Number.isFinite(number) &&
        number > 0
    );

};


const validEmail = (
    value
) => {

    return (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                String(
                    value ||
                    ""
                ).trim()
            )
    );

};


// ======================================================
// ADD DONATION - FINANCE MANAGER
// ======================================================

const addDonation =
    async (
        req,
        res
    ) => {

        const {

            fullName,
            phone,
            email,
            amount,
            date

        } = req.body;


        const normalizedName =
            fullName?.trim() ||
            "";


        const normalizedPhone =
            phone?.trim() ||
            "";


        const normalizedEmail =
            email
                ?.trim()
                .toLowerCase() ||
            "";


        // ==================================================
        // VALIDATION
        // ==================================================

        if (
            !normalizedName ||
            !normalizedPhone ||
            !normalizedEmail ||
            !amount ||
            !date
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Please fill in all donation fields."
                });

        }


        if (
            !validEmail(
                normalizedEmail
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Please enter a valid donor email address."
                });

        }


        if (
            !validAmount(
                amount
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Donation amount must be greater than zero."
                });

        }


        let transactionStarted =
            false;


        try {

            await beginTransactionAsync();

            transactionStarted =
                true;


            // ==================================================
            // CHECK EXISTING DONOR PROFILE
            // ==================================================

            const profiles =
                await queryAsync(
                    `

                        SELECT

                            id,
                            full_name,
                            phone,
                            email

                        FROM donor_profiles

                        WHERE
                            phone = ?
                            OR LOWER(email) = LOWER(?)

                        LIMIT 1

                    `,
                    [
                        normalizedPhone,
                        normalizedEmail
                    ]
                );


            let donationName =
                normalizedName;


            let donationPhone =
                normalizedPhone;


            let donorEmail =
                normalizedEmail;


            // ==================================================
            // EXISTING DONOR
            // ==================================================

            if (
                profiles.length >
                0
            ) {

                const profile =
                    profiles[0];


                // ==================================================
                // IMPORTANT:
                //
                // Do not silently change donor details.
                // Those changes still require OTP.
                // ==================================================

                if (
                    profile.phone !==
                        normalizedPhone ||
                    profile.email
                        .trim()
                        .toLowerCase() !==
                        normalizedEmail
                ) {

                    await rollbackAsync();

                    transactionStarted =
                        false;


                    return res
                        .status(409)
                        .json({
                            message:
                                "This donor already has registered contact details. Please use the registered phone/email or use the donor detail change OTP feature."
                        });

                }


                donationName =
                    profile.full_name;


                donationPhone =
                    profile.phone;


                donorEmail =
                    profile.email;

            } else {

                // ==================================================
                // NEW DONOR PROFILE
                // ==================================================

                await queryAsync(
                    `

                        INSERT INTO donor_profiles
                        (
                            full_name,
                            phone,
                            email
                        )

                        VALUES (?, ?, ?)

                    `,
                    [

                        normalizedName,

                        normalizedPhone,

                        normalizedEmail

                    ]
                );

            }


            // ==================================================
            // INSERT DONATION
            //
            // NO EMAIL COLUMN IS ADDED TO donations.
            // ==================================================

            const donationResult =
                await queryAsync(
                    `

                        INSERT INTO donations
                        (
                            full_name,
                            phone,
                            amount,
                            donation_date
                        )

                        VALUES (?, ?, ?, ?)

                    `,
                    [

                        donationName,

                        donationPhone,

                        Number(
                            amount
                        ),

                        date

                    ]
                );


            await commitAsync();

            transactionStarted =
                false;


            // ==================================================
            // SEND THANK-YOU / APPROVED EMAIL
            //
            // Email failure must NOT undo donation.
            // ==================================================

            try {

                await sendDonationApprovedEmail({

                    full_name:
                        donationName,

                    phone:
                        donationPhone,

                    email:
                        donorEmail,

                    amount:
                        Number(
                            amount
                        ),

                    transaction_date:
                        date

                });


            } catch (
                emailError
            ) {

                console.error(
                    "MANUAL DONATION EMAIL FAILED:",
                    emailError
                );

            }


            return res
                .status(201)
                .json({

                    success:
                        true,

                    message:
                        "Donation added successfully.",

                    id:
                        donationResult.insertId

                });


        } catch (
            err
        ) {

            if (
                transactionStarted
            ) {

                try {

                    await rollbackAsync();

                } catch (
                    rollbackError
                ) {

                    console.error(
                        "ADD DONATION ROLLBACK ERROR:",
                        rollbackError
                    );

                }

            }


            console.error(
                "ADD DONATION ERROR:",
                err
            );


            if (
                err.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "This email or phone number is already registered to another donor."
                    });

            }


            return res
                .status(500)
                .json({
                    message:
                        "Unable to add donation."
                });

        }

    };


// ======================================================
// GET DONATIONS
// PUBLIC / GUEST
// ======================================================

const getDonations =
    (
        req,
        res
    ) => {

        const search =
            req.query.search
                ?.trim() ||
            "";


        const sort =
            req.query.sort ||
            "id";


        const sortOptions = {

            id:
                "id ASC",

            amountAsc:
                "amount ASC",

            amountDesc:
                "amount DESC",

            dateNewest:
                "donation_date DESC, id DESC",

            dateOldest:
                "donation_date ASC, id ASC"

        };


        const orderBy =
            sortOptions[
                sort
            ] ||
            sortOptions.id;


        const value =
            `%${search}%`;


        db.query(
            `

                SELECT

                    id,
                    full_name,
                    phone,
                    amount,
                    donation_date

                FROM donations

                WHERE
                    full_name LIKE ?
                    OR phone LIKE ?
                    OR CAST(
                        amount AS CHAR
                    ) LIKE ?

                ORDER BY ${orderBy}

            `,
            [
                value,
                value,
                value
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "GET DONATIONS ERROR:",
                        err
                    );


                    return res
                        .status(500)
                        .json({
                            message:
                                "Unable to load donations."
                        });

                }


                return res
                    .status(200)
                    .json(
                        result
                    );

            }
        );

    };


// ======================================================
// UPDATE DONATION
// MANAGER
// ======================================================

const updateDonation =
    (
        req,
        res
    ) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid donation ID."
                });

        }


        const {

            fullName,
            phone,
            amount,
            date

        } = req.body;


        if (
            !fullName?.trim() ||
            !phone?.trim() ||
            !amount ||
            !date
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Please fill in all donation fields."
                });

        }


        if (
            !validAmount(
                amount
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Donation amount must be greater than zero."
                });

        }


        db.query(
            `

                UPDATE donations

                SET
                    full_name = ?,
                    phone = ?,
                    amount = ?,
                    donation_date = ?

                WHERE id = ?

            `,
            [

                fullName.trim(),

                phone.trim(),

                Number(amount),

                date,

                id

            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "UPDATE DONATION ERROR:",
                        err
                    );


                    return res
                        .status(500)
                        .json({
                            message:
                                "Unable to update donation."
                        });

                }


                if (
                    result.affectedRows ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({
                            message:
                                "Donation not found."
                        });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Donation updated successfully."

                });

            }
        );

    };


// ======================================================
// DELETE DONATION
// MANAGER
// ======================================================

const deleteDonation =
    (
        req,
        res
    ) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid donation ID."
                });

        }


        db.query(
            `

                DELETE FROM donations

                WHERE id = ?

            `,
            [
                id
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "DELETE DONATION ERROR:",
                        err
                    );


                    return res
                        .status(500)
                        .json({
                            message:
                                "Unable to delete donation."
                        });

                }


                if (
                    result.affectedRows ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({
                            message:
                                "Donation not found."
                        });

                }


                return res.json({

                    success:
                        true,

                    message:
                        "Donation deleted successfully."

                });

            }
        );

    };


// ======================================================
// SUBMIT DONATION REQUEST
//
// ONLY:
// Full Name
// Phone
// Email
// Account Title
// Amount
// Transaction Date
// ======================================================

const submitDonationRequest =
    async (
        req,
        res
    ) => {

        try {

            const {

                fullName,
                phone,
                email,
                accountTitle,
                amount,
                transactionDate

            } = req.body;


            const normalizedEmail =
                email
                    ?.trim()
                    .toLowerCase() ||
                "";


            if (
                !fullName?.trim() ||
                !phone?.trim() ||
                !normalizedEmail ||
                !accountTitle?.trim() ||
                !amount ||
                !transactionDate
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Please complete all donation request fields."
                    });

            }


            if (
                !validEmail(
                    normalizedEmail
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Please enter a valid email address."
                    });

            }


            if (
                !validAmount(
                    amount
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Donation amount must be greater than zero."
                    });

            }


            const requestData = {

                full_name:
                    fullName.trim(),

                phone:
                    phone.trim(),

                email:
                    normalizedEmail,

                account_title:
                    accountTitle.trim(),

                amount:
                    Number(amount),

                transaction_date:
                    transactionDate

            };


            const result =
                await queryAsync(
                    `

                        INSERT INTO pending_donations
                        (
                            full_name,
                            phone,
                            email,
                            account_title,
                            amount,
                            transaction_date,
                            status
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            'pending'
                        )

                    `,
                    [

                        requestData.full_name,

                        requestData.phone,

                        requestData.email,

                        requestData.account_title,

                        requestData.amount,

                        requestData.transaction_date

                    ]
                );


            // ==================================================
            // EMAILS
            //
            // Email failure should NOT delete the request.
            // ==================================================

            const emailResults =
                await Promise.allSettled([

                    sendDonationRequestSubmittedEmail(
                        requestData
                    ),

                    sendManagerDonationRequestEmail(
                        requestData
                    )

                ]);


            emailResults.forEach(
                (
                    result,
                    index
                ) => {

                    if (
                        result.status ===
                        "rejected"
                    ) {

                        console.error(
                            index === 0
                                ? "DONOR SUBMISSION EMAIL FAILED:"
                                : "MANAGER REQUEST EMAIL FAILED:",

                            result.reason
                        );

                    }

                }
            );


            return res
                .status(201)
                .json({

                    success:
                        true,

                    message:
                        "Donation request submitted successfully. You will be notified after verification.",

                    id:
                        result.insertId

                });


        } catch (
            err
        ) {

            console.error(
                "SUBMIT DONATION REQUEST ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to submit donation request."
                });

        }

    };


// ======================================================
// GET REQUEST HISTORY
// MANAGER
// ======================================================

const getDonationRequests =
    async (
        req,
        res
    ) => {

        try {

            const requests =
                await queryAsync(
                    `

                        SELECT

                            id,
                            full_name,
                            phone,
                            email,
                            account_title,
                            amount,

                            DATE_FORMAT(
                                transaction_date,
                                '%Y-%m-%d'
                            ) AS transaction_date,

                            status,
                            decision_at,
                            created_at

                        FROM pending_donations

                        ORDER BY

                            CASE
                                WHEN status = 'pending'
                                    THEN 0
                                ELSE 1
                            END,

                            created_at DESC

                    `
                );


            return res.json(
                requests
            );


        } catch (
            err
        ) {

            console.error(
                "GET REQUESTS ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to load donation requests."
                });

        }

    };


// ======================================================
// PENDING COUNT
// ======================================================

const getPendingRequestCount =
    async (
        req,
        res
    ) => {

        try {

            const result =
                await queryAsync(
                    `

                        SELECT
                            COUNT(*) AS count

                        FROM pending_donations

                        WHERE
                            status = 'pending'

                    `
                );


            return res.json({

                count:
                    Number(
                        result[0]
                            ?.count ||
                        0
                    )

            });


        } catch (
            err
        ) {

            console.error(
                "REQUEST COUNT ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to load request count."
                });

        }

    };


// ======================================================
// APPROVE REQUEST
// ======================================================

const approveDonationRequest =
    async (
        req,
        res
    ) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid donation request ID."
                });

        }


        let transactionStarted =
            false;


        try {

            await beginTransactionAsync();

            transactionStarted =
                true;


            // ==================================================
            // LOCK REQUEST
            // ==================================================

            const requests =
                await queryAsync(
                    `

                        SELECT *

                        FROM pending_donations

                        WHERE id = ?

                        FOR UPDATE

                    `,
                    [
                        id
                    ]
                );


            if (
                requests.length ===
                0
            ) {

                await rollbackAsync();

                transactionStarted =
                    false;


                return res
                    .status(404)
                    .json({
                        message:
                            "Donation request not found."
                    });

            }


            const request =
                requests[0];


            if (
                request.status !==
                "pending"
            ) {

                await rollbackAsync();

                transactionStarted =
                    false;


                return res
                    .status(409)
                    .json({
                        message:
                            `This request is already ${request.status}.`
                    });

            }


            // ==================================================
            // DONATION VALUES
            //
            // If donor already has a verified profile,
            // use registered name + phone.
            //
            // This prevents donation request form from
            // bypassing the OTP detail-change process.
            // ==================================================

            let donationName =
                request.full_name;


            let donationPhone =
                request.phone;


            if (
                request.email
            ) {

                const profiles =
                    await queryAsync(
                        `

                            SELECT

                                id,
                                full_name,
                                phone,
                                email

                            FROM donor_profiles

                            WHERE
                                phone = ?
                                OR LOWER(email)
                                    = LOWER(?)

                            LIMIT 1

                        `,
                        [
                            request.phone,
                            request.email
                        ]
                    );


                if (
                    profiles.length >
                    0
                ) {

                    const profile =
                        profiles[0];


                    donationName =
                        profile.full_name;


                    donationPhone =
                        profile.phone;

                } else {

                    // ==========================================
                    // NEW DONOR PROFILE
                    // ==========================================

                    await queryAsync(
                        `

                            INSERT INTO donor_profiles
                            (
                                full_name,
                                phone,
                                email
                            )

                            VALUES (?, ?, ?)

                        `,
                        [

                            request.full_name,

                            request.phone,

                            request.email
                                .trim()
                                .toLowerCase()

                        ]
                    );

                }

            }


            // ==================================================
            // INSERT FINANCIAL RECORD
            //
            // IMPORTANT:
            // ONLY EXISTING donations COLUMNS.
            // ==================================================

            await queryAsync(
                `

                    INSERT INTO donations
                    (
                        full_name,
                        phone,
                        amount,
                        donation_date
                    )

                    VALUES (?, ?, ?, ?)

                `,
                [

                    donationName,

                    donationPhone,

                    request.amount,

                    request.transaction_date

                ]
            );


            // ==================================================
            // KEEP REQUEST HISTORY
            // ==================================================

            await queryAsync(
                `

                    UPDATE pending_donations

                    SET
                        status = 'accepted',
                        decision_at = NOW()

                    WHERE id = ?

                `,
                [
                    id
                ]
            );


            await commitAsync();

            
            transactionStarted =
                false;

            try {

    if (
        request.email
    ) {

        await sendDonationApprovedEmail(
            request
        );

    }


} catch (
    emailError
) {

    console.error(
        "DONATION APPROVAL EMAIL FAILED:",
        emailError
    );

}

            return res.json({

                success:
                    true,

                message:
                    "Donation request accepted successfully."

            });


        } catch (
            err
        ) {

            if (
                transactionStarted
            ) {

                try {

                    await rollbackAsync();

                } catch (
                    rollbackError
                ) {

                    console.error(
                        "ROLLBACK ERROR:",
                        rollbackError
                    );

                }

            }


            console.error(
                "APPROVE REQUEST ERROR:",
                err
            );


            if (
                err.code ===
                "ER_DUP_ENTRY"
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "A donor profile already uses this phone number or email address."
                    });

            }


            return res
                .status(500)
                .json({
                    message:
                        "Unable to accept donation request."
                });

        }

    };


// ======================================================
// REJECT REQUEST
// ======================================================

const rejectDonationRequest =
    async (
        req,
        res
    ) => {

        const id =
            Number(
                req.params.id
            );


        if (
            !Number.isInteger(id) ||
            id <= 0
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid donation request ID."
                });

        }


        try {

            // ==================================================
            // LOAD REQUEST FIRST
            // ==================================================

            const requests =
                await queryAsync(
                    `

                        SELECT

                            id,
                            full_name,
                            phone,
                            email,
                            account_title,
                            amount,

                            DATE_FORMAT(
                                transaction_date,
                                '%Y-%m-%d'
                            ) AS transaction_date,

                            status

                        FROM pending_donations

                        WHERE id = ?

                        LIMIT 1

                    `,
                    [
                        id
                    ]
                );


            if (
                requests.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Donation request not found."
                    });

            }


            const request =
                requests[0];


            if (
                request.status !==
                "pending"
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            `This donation request is already ${request.status}.`
                    });

            }


            // ==================================================
            // REJECT
            // ==================================================

            const result =
                await queryAsync(
                    `

                        UPDATE pending_donations

                        SET
                            status = 'rejected',
                            decision_at = NOW()

                        WHERE
                            id = ?
                            AND status = 'pending'

                    `,
                    [
                        id
                    ]
                );


            if (
                result.affectedRows ===
                0
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "Request has already been processed."
                    });

            }


            // ==================================================
            // SEND REJECTION EMAIL
            // ==================================================

            try {

                if (
                    request.email
                ) {

                    await sendDonationRejectedEmail(
                        request
                    );

                }

            } catch (
                emailError
            ) {

                console.error(
                    "DONATION REJECTION EMAIL FAILED:",
                    emailError
                );

            }


            return res.json({

                success:
                    true,

                message:
                    "Donation request rejected."

            });


        } catch (
            err
        ) {

            console.error(
                "REJECT REQUEST ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to reject donation request."
                });

        }

    };


module.exports = {

    addDonation,

    getDonations,

    updateDonation,

    deleteDonation,

    submitDonationRequest,

    getDonationRequests,

    getPendingRequestCount,

    approveDonationRequest,

    rejectDonationRequest

};