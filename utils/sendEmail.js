const {
    Resend
} = require("resend");


const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );


const FROM_EMAIL =
    process.env.EMAIL_FROM ||
    "AFBROS <afbros@nexvertex.dev>";


// ======================================================
// HELPERS
// ======================================================

const escapeHtml = (
    value
) => {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

};


const formatAmount = (
    amount
) => {

    return Number(
        amount || 0
    ).toLocaleString(
        "en-PK"
    );

};


const getManagerEmails = () => {

    return String(
        process.env.FINANCE_MANAGER_EMAIL ||
        ""
    )
        .split(",")
        .map(
            (
                email
            ) =>
                email.trim()
        )
        .filter(Boolean);

};


// ======================================================
// BASE SEND FUNCTION
// ======================================================

const sendEmail =
    async ({
        to,
        subject,
        html
    }) => {

        const recipients =
            Array.isArray(to)
                ? to
                : [
                    to
                ];


        const {
            data,
            error
        } =
            await resend.emails.send({

                from:
                    FROM_EMAIL,

                to:
                    recipients,

                subject,

                html

            });


        if (
            error
        ) {

            console.error(
                "EMAIL SEND ERROR:",
                error
            );


            throw new Error(
                error.message ||
                "Failed to send email."
            );

        }


        console.log(
            "AFBROS EMAIL SENT:",
            data?.id
        );


        return data;

    };


// ======================================================
// OTP EMAIL
// ======================================================

const sendOTPEmail =
    async (
        email,
        otp
    ) => {

        return sendEmail({

            to:
                email,

            subject:
                "AFBROS Donor Details Verification OTP",

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:520px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #e6ebe8;
                    border-radius:14px;
                    background:#ffffff;
                ">

                    <h2 style="
                        margin-top:0;
                        color:#198754;
                    ">
                        AFBROS Donor Verification
                    </h2>


                    <p>
                        You requested to update your AFBROS
                        donor information.
                    </p>


                    <p>
                        Your verification code is:
                    </p>


                    <div style="
                        font-size:32px;
                        font-weight:bold;
                        letter-spacing:8px;
                        padding:16px;
                        margin:20px 0;
                        background:#f3f8f5;
                        color:#198754;
                        text-align:center;
                        border-radius:8px;
                    ">
                        ${escapeHtml(otp)}
                    </div>


                    <p>
                        This OTP expires in
                        <strong>10 minutes</strong>.
                    </p>


                    <p>
                        If you did not request this change,
                        you can safely ignore this email.
                    </p>


                    <hr style="
                        border:none;
                        border-top:1px solid #e6ebe8;
                        margin:25px 0;
                    ">


                    <small style="color:#849089;">
                        AFBROS Finance System
                        <br>
                        afbros@nexvertex.dev
                    </small>

                </div>

            `

        });

    };


// ======================================================
// DONOR: REQUEST SUBMITTED
// ======================================================

const sendDonationRequestSubmittedEmail =
    async (
        request
    ) => {

        return sendEmail({

            to:
                request.email,

            subject:
                "AFBROS Donation Request Received",

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:560px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #e6ebe8;
                    border-radius:14px;
                ">

                    <h2 style="color:#198754;">
                        Thank You, ${escapeHtml(
                            request.full_name
                        )}
                    </h2>


                    <p>
                        We have received your donation request.
                    </p>


                    <p>
                        Your request has been forwarded to the
                        AFBROS Finance Manager for verification.
                    </p>


                    <div style="
                        margin:20px 0;
                        padding:18px;
                        background:#f5f7f6;
                        border-radius:10px;
                    ">

                        <strong>Amount:</strong>
                        Rs. ${formatAmount(
                            request.amount
                        )}

                        <br>

                        <strong>Transaction Date:</strong>
                        ${escapeHtml(
                            request.transaction_date
                        )}

                        <br>

                        <strong>Account Title:</strong>
                        ${escapeHtml(
                            request.account_title
                        )}

                    </div>


                    <p>
                        You will receive another email when your
                        donation is either
                        <strong>approved</strong> or
                        <strong>rejected</strong>.
                    </p>


                    <p>
                        Thank you for supporting AFBROS.
                    </p>


                    <hr>

                    <small style="color:#849089;">
                        AFBROS Finance System
                    </small>

                </div>

            `

        });

    };


// ======================================================
// MANAGER: NEW REQUEST
// ======================================================

const sendManagerDonationRequestEmail =
    async (
        request
    ) => {

        const managerEmails =
            getManagerEmails();


        if (
            managerEmails.length ===
            0
        ) {

            console.warn(
                "FINANCE_MANAGER_EMAIL is not configured."
            );

            return null;

        }


        return sendEmail({

            to:
                managerEmails,

            subject:
                `New AFBROS Donation Request - Rs. ${formatAmount(
                    request.amount
                )}`,

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:600px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #e6ebe8;
                    border-radius:14px;
                ">

                    <h2 style="color:#198754;">
                        New Donation Request
                    </h2>


                    <p>
                        A new donation request requires Finance
                        Manager verification.
                    </p>


                    <table style="
                        width:100%;
                        border-collapse:collapse;
                        margin-top:20px;
                    ">

                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Full Name
                            </td>

                            <td style="padding:9px;">
                                ${escapeHtml(
                                    request.full_name
                                )}
                            </td>
                        </tr>


                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Phone
                            </td>

                            <td style="padding:9px;">
                                ${escapeHtml(
                                    request.phone
                                )}
                            </td>
                        </tr>


                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Email
                            </td>

                            <td style="padding:9px;">
                                ${escapeHtml(
                                    request.email
                                )}
                            </td>
                        </tr>


                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Account Title
                            </td>

                            <td style="padding:9px;">
                                ${escapeHtml(
                                    request.account_title
                                )}
                            </td>
                        </tr>


                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Amount
                            </td>

                            <td style="
                                padding:9px;
                                color:#198754;
                                font-weight:bold;
                            ">
                                Rs. ${formatAmount(
                                    request.amount
                                )}
                            </td>
                        </tr>


                        <tr>
                            <td style="padding:9px;font-weight:bold;">
                                Transaction Date
                            </td>

                            <td style="padding:9px;">
                                ${escapeHtml(
                                    request.transaction_date
                                )}
                            </td>
                        </tr>

                    </table>


                    <p style="margin-top:24px;">
                        Please review this request from the
                        AFBROS Finance Manager dashboard.
                    </p>

                </div>

            `

        });

    };


// ======================================================
// DONOR: APPROVED
// ======================================================

const sendDonationApprovedEmail =
    async (
        request
    ) => {

        return sendEmail({

            to:
                request.email,

            subject:
                "Your AFBROS Donation Has Been Approved",

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:560px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #dcebe2;
                    border-radius:14px;
                ">

                    <h2 style="color:#198754;">
                        Donation Approved ✓
                    </h2>


                    <p>
                        Dear ${escapeHtml(
                            request.full_name
                        )},
                    </p>


                    <p>
                        Thank you for supporting AFBROS.
                    </p>


                    <p>
                        Your donation request has been
                        <strong style="color:#198754;">
                            approved
                        </strong>
                        by the Finance Manager.
                    </p>


                    <div style="
                        margin:20px 0;
                        padding:18px;
                        background:#f3f8f5;
                        border-radius:10px;
                    ">

                        <strong>Donation Amount:</strong>

                        <span style="
                            color:#198754;
                            font-weight:bold;
                        ">
                            Rs. ${formatAmount(
                                request.amount
                            )}
                        </span>

                        <br>

                        <strong>Transaction Date:</strong>
                        ${escapeHtml(
                            request.transaction_date
                        )}

                    </div>


                    <p>
                        Your donation has now been added to the
                        official AFBROS donation records.
                    </p>


                    <p>
                        We sincerely appreciate your contribution.
                    </p>

                </div>

            `

        });

    };


// ======================================================
// DONOR: REJECTED
// ======================================================

const sendDonationRejectedEmail =
    async (
        request
    ) => {

        return sendEmail({

            to:
                request.email,

            subject:
                "AFBROS Donation Request Update",

            html: `

                <div style="
                    font-family:Arial,sans-serif;
                    max-width:560px;
                    margin:auto;
                    padding:30px;
                    border:1px solid #f0d8dc;
                    border-radius:14px;
                ">

                    <h2 style="color:#dc3545;">
                        Donation Request Rejected
                    </h2>


                    <p>
                        Dear ${escapeHtml(
                            request.full_name
                        )},
                    </p>


                    <p>
                        Your donation request for
                        <strong>
                            Rs. ${formatAmount(
                                request.amount
                            )}
                        </strong>
                        was not approved during verification.
                    </p>


                    <p>
                        If you believe the request was rejected
                        incorrectly, or if any information was
                        entered incorrectly, you may submit a
                        <strong>new donation request</strong>
                        with the correct details.
                    </p>


                    <p>
                        A rejected request does not prevent you
                        from submitting another request.
                    </p>


                    <p>
                        Thank you for supporting AFBROS.
                    </p>


                    <hr>

                    <small style="color:#849089;">
                        AFBROS Finance System
                    </small>

                </div>

            `

        });

    };


// ======================================================
// BACKWARD COMPATIBILITY
//
// Existing donorProfileController:
// const sendOTPEmail = require("../utils/sendEmail");
// continues to work.
// ======================================================

module.exports =
    sendOTPEmail;


module.exports.sendOTPEmail =
    sendOTPEmail;


module.exports.sendDonationRequestSubmittedEmail =
    sendDonationRequestSubmittedEmail;


module.exports.sendManagerDonationRequestEmail =
    sendManagerDonationRequestEmail;


module.exports.sendDonationApprovedEmail =
    sendDonationApprovedEmail;


module.exports.sendDonationRejectedEmail =
    sendDonationRejectedEmail;