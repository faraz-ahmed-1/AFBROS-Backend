const crypto =
    require("crypto");

const db =
    require("../config/db");

const sendOTPEmail =
    require(
        "../utils/sendEmail"
    );


// ======================================================
// QUERY HELPER
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


// ======================================================
// TRANSACTION HELPERS
// ======================================================

const beginTransactionAsync =
    () =>
        new Promise(
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


const commitAsync =
    () =>
        new Promise(
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


const rollbackAsync =
    () =>
        new Promise(
            (
                resolve
            ) => {

                db.rollback(
                    () =>
                        resolve()
                );

            }
        );


// ======================================================
// HELPERS
// ======================================================

const validEmail = (
    email
) => {

    return (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(
                String(
                    email ||
                    ""
                ).trim()
            )
    );

};


const getOtpSecret =
    () => {

        const secret =
            process.env.OTP_SECRET ||
            process.env.JWT_SECRET;


        if (!secret) {

            throw new Error(
                "OTP_SECRET or JWT_SECRET is required."
            );

        }


        return secret;

    };


const hashOtp = (
    otp
) => {

    return crypto
        .createHmac(
            "sha256",
            getOtpSecret()
        )
        .update(
            String(otp)
        )
        .digest(
            "hex"
        );

};


const maskEmail = (
    email
) => {

    const [
        name,
        domain
    ] =
        String(email)
            .split("@");


    if (
        !name ||
        !domain
    ) {

        return email;

    }


    const visible =
        name.substring(
            0,
            Math.min(
                2,
                name.length
            )
        );


    return (
        `${visible}***@${domain}`
    );

};


// ======================================================
// REQUEST UPDATE OTP
// ======================================================

const requestUpdateOtp =
    async (
        req,
        res
    ) => {

        try {

            const {

                currentEmail,
                fullName,
                phone,
                email

            } = req.body;


            const registeredEmail =
                currentEmail
                    ?.trim()
                    .toLowerCase() ||
                "";


            let newName =
                fullName
                    ?.trim() ||
                "";


            let newPhone =
                phone
                    ?.trim() ||
                "";


            let newEmail =
                email
                    ?.trim()
                    .toLowerCase() ||
                "";


            // ==================================================
            // CURRENT EMAIL
            // ==================================================

            if (
                !registeredEmail ||
                !validEmail(
                    registeredEmail
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Enter your valid registered email address."
                    });

            }


            // ==================================================
            // EMPTY CHANGE FORM
            // ==================================================

            if (
                !newName &&
                !newPhone &&
                !newEmail
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Enter at least one donor detail to change."
                    });

            }


            if (
                newEmail &&
                !validEmail(
                    newEmail
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Please enter a valid new email address."
                    });

            }


            // ==================================================
            // FIND REGISTERED DONOR
            // ==================================================

            const donors =
                await queryAsync(
                    `

                        SELECT

                            id,
                            full_name,
                            phone,
                            email

                        FROM donor_profiles

                        WHERE
                            LOWER(email)
                            = LOWER(?)

                        LIMIT 1

                    `,
                    [
                        registeredEmail
                    ]
                );


            if (
                donors.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "No donor profile was found with this registered email."
                    });

            }


            const donor =
                donors[0];


            // ==================================================
            // REMOVE VALUES THAT ARE NOT ACTUAL CHANGES
            // ==================================================

            if (
                newName &&
                newName.toLowerCase() ===
                    donor.full_name
                        .trim()
                        .toLowerCase()
            ) {

                newName =
                    "";

            }


            if (
                newPhone &&
                newPhone ===
                    donor.phone
            ) {

                newPhone =
                    "";

            }


            if (
                newEmail &&
                newEmail.toLowerCase() ===
                    donor.email
                        .trim()
                        .toLowerCase()
            ) {

                newEmail =
                    "";

            }


            if (
                !newName &&
                !newPhone &&
                !newEmail
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "The entered details are already the same as your current donor details."
                    });

            }


            // ==================================================
            // DUPLICATE PHONE
            // ==================================================

            if (
                newPhone
            ) {

                const duplicatePhone =
                    await queryAsync(
                        `

                            SELECT id

                            FROM donor_profiles

                            WHERE
                                phone = ?
                                AND id != ?

                            LIMIT 1

                        `,
                        [
                            newPhone,
                            donor.id
                        ]
                    );


                if (
                    duplicatePhone.length >
                    0
                ) {

                    return res
                        .status(409)
                        .json({
                            message:
                                "That phone number belongs to another donor."
                        });

                }

            }


            // ==================================================
            // DUPLICATE EMAIL
            // ==================================================

            if (
                newEmail
            ) {

                const duplicateEmail =
                    await queryAsync(
                        `

                            SELECT id

                            FROM donor_profiles

                            WHERE
                                LOWER(email)
                                = LOWER(?)

                                AND id != ?

                            LIMIT 1

                        `,
                        [
                            newEmail,
                            donor.id
                        ]
                    );


                if (
                    duplicateEmail.length >
                    0
                ) {

                    return res
                        .status(409)
                        .json({
                            message:
                                "That email address belongs to another donor."
                        });

                }

            }


            // ==================================================
            // RATE LIMIT
            // 1 OTP PER 60 SECONDS
            // ==================================================

            const recentOtp =
                await queryAsync(
                    `

                        SELECT id

                        FROM donor_update_otps

                        WHERE
                            donor_id = ?

                            AND created_at >
                                DATE_SUB(
                                    NOW(),
                                    INTERVAL 60 SECOND
                                )

                        ORDER BY
                            created_at DESC

                        LIMIT 1

                    `,
                    [
                        donor.id
                    ]
                );


            if (
                recentOtp.length >
                0
            ) {

                return res
                    .status(429)
                    .json({
                        message:
                            "Please wait 60 seconds before requesting another OTP."
                    });

            }


            // ==================================================
            // INVALIDATE OLD OTP REQUESTS
            // ==================================================

            await queryAsync(
                `

                    DELETE FROM donor_update_otps

                    WHERE
                        donor_id = ?
                        AND verified_at IS NULL

                `,
                [
                    donor.id
                ]
            );


            // ==================================================
            // CREATE OTP
            // ==================================================

            const otp =
                String(
                    crypto.randomInt(
                        100000,
                        1000000
                    )
                );


            const otpHash =
                hashOtp(
                    otp
                );


            const result =
                await queryAsync(
                    `

                        INSERT INTO donor_update_otps
                        (
                            donor_id,

                            new_full_name,

                            new_phone,

                            new_email,

                            otp_hash,

                            attempts,

                            expires_at
                        )

                        VALUES
                        (
                            ?,
                            ?,
                            ?,
                            ?,
                            ?,
                            0,
                            DATE_ADD(
                                NOW(),
                                INTERVAL 10 MINUTE
                            )
                        )

                    `,
                    [

                        donor.id,

                        newName ||
                            null,

                        newPhone ||
                            null,

                        newEmail ||
                            null,

                        otpHash

                    ]
                );


            // ==================================================
            // SEND TO CURRENT REGISTERED EMAIL
            // ==================================================

            try {

                await sendOTPEmail(
                    donor.email,
                    otp
                );


            } catch (
                emailError
            ) {

                await queryAsync(
                    `

                        DELETE FROM donor_update_otps

                        WHERE id = ?

                    `,
                    [
                        result.insertId
                    ]
                );


                throw emailError;

            }


            return res.json({

                success:
                    true,

                otpRequestId:
                    result.insertId,

                sentTo:
                    maskEmail(
                        donor.email
                    ),

                message:
                    "OTP sent to your registered email address."

            });


        } catch (
            err
        ) {

            console.error(
                "REQUEST DONOR UPDATE OTP ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to send donor verification OTP."
                });

        }

    };


// ======================================================
// VERIFY OTP AND APPLY CHANGE
// ======================================================

const verifyUpdateOtp =
    async (
        req,
        res
    ) => {

        const otpRequestId =
            Number(
                req.body
                    .otpRequestId
            );


        const otp =
            String(
                req.body.otp ||
                ""
            ).trim();


        if (
            !Number.isInteger(
                otpRequestId
            ) ||
            otpRequestId <= 0
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Invalid OTP request."
                });

        }


        if (
            !/^\d{6}$/.test(
                otp
            )
        ) {

            return res
                .status(400)
                .json({
                    message:
                        "Enter the 6-digit OTP."
                });

        }


        let transactionStarted =
            false;


        try {

            const rows =
                await queryAsync(
                    `

                        SELECT

                            o.*,

                            d.full_name
                                AS current_full_name,

                            d.phone
                                AS current_phone,

                            d.email
                                AS current_email,

                            (
                                o.expires_at > NOW()
                            )
                                AS otp_valid

                        FROM donor_update_otps o

                        INNER JOIN donor_profiles d
                            ON d.id =
                                o.donor_id

                        WHERE
                            o.id = ?

                            AND o.verified_at
                                IS NULL

                        LIMIT 1

                    `,
                    [
                        otpRequestId
                    ]
                );


            if (
                rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({
                        message:
                            "OTP request was not found or has already been used."
                    });

            }


            const request =
                rows[0];


            // ==================================================
            // EXPIRED
            // ==================================================

            if (
                !Number(
                    request.otp_valid
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "OTP has expired. Request a new code."
                    });

            }


            // ==================================================
            // ATTEMPT LIMIT
            // ==================================================

            if (
                Number(
                    request.attempts
                ) >= 5
            ) {

                return res
                    .status(429)
                    .json({
                        message:
                            "Too many incorrect attempts. Request a new OTP."
                    });

            }


            // ==================================================
            // VERIFY HASH
            // ==================================================

            if (
                hashOtp(
                    otp
                ) !==
                request.otp_hash
            ) {

                await queryAsync(
                    `

                        UPDATE donor_update_otps

                        SET
                            attempts =
                                attempts + 1

                        WHERE id = ?

                    `,
                    [
                        request.id
                    ]
                );


                return res
                    .status(400)
                    .json({
                        message:
                            "Incorrect OTP."
                    });

            }


            const updatedName =
                request.new_full_name ||
                request.current_full_name;


            const updatedPhone =
                request.new_phone ||
                request.current_phone;


            const updatedEmail =
                request.new_email ||
                request.current_email;


            // ==================================================
            // DUPLICATE CHECK AGAIN
            // ==================================================

            const duplicate =
                await queryAsync(
                    `

                        SELECT id

                        FROM donor_profiles

                        WHERE
                            id != ?

                            AND
                            (
                                phone = ?

                                OR LOWER(email)
                                    = LOWER(?)
                            )

                        LIMIT 1

                    `,
                    [

                        request.donor_id,

                        updatedPhone,

                        updatedEmail

                    ]
                );


            if (
                duplicate.length >
                0
            ) {

                return res
                    .status(409)
                    .json({
                        message:
                            "The new phone number or email is already in use."
                    });

            }


            // ==================================================
            // TRANSACTION
            // ==================================================

            await beginTransactionAsync();

            transactionStarted =
                true;


            // ==================================================
            // UPDATE PROFILE
            // ==================================================

            await queryAsync(
                `

                    UPDATE donor_profiles

                    SET
                        full_name = ?,
                        phone = ?,
                        email = ?

                    WHERE id = ?

                `,
                [

                    updatedName,

                    updatedPhone,

                    updatedEmail,

                    request.donor_id

                ]
            );


            // ==================================================
            // UPDATE DONATIONS
            //
            // STILL ONLY EXISTING COLUMNS.
            // EMAIL IS NEVER STORED HERE.
            // ==================================================

            await queryAsync(
                `

                    UPDATE donations

                    SET
                        full_name = ?,
                        phone = ?

                    WHERE
                        phone = ?

                `,
                [

                    updatedName,

                    updatedPhone,

                    request.current_phone

                ]
            );


            // ==================================================
            // MARK OTP USED
            // ==================================================

            await queryAsync(
                `

                    UPDATE donor_update_otps

                    SET
                        verified_at = NOW()

                    WHERE id = ?

                `,
                [
                    request.id
                ]
            );


            await commitAsync();

            transactionStarted =
                false;


            return res.json({

                success:
                    true,

                message:
                    "Donor details updated successfully.",

                donor: {

                    fullName:
                        updatedName,

                    phone:
                        updatedPhone,

                    email:
                        updatedEmail

                }

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
                        rollbackError
                    );

                }

            }


            console.error(
                "VERIFY DONOR UPDATE OTP ERROR:",
                err
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to update donor details."
                });

        }

    };


module.exports = {

    requestUpdateOtp,

    verifyUpdateOtp

};