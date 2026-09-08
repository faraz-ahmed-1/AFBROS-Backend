const {
    Resend
} = require("resend");


const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );


// ======================================================
// SEND OTP EMAIL
// ======================================================

const sendOTPEmail =
    async (
        email,
        otp
    ) => {

        const {
            data,
            error
        } =
            await resend.emails.send({

                from:
                    process.env.EMAIL_FROM,

                to: [
                    email
                ],

                subject:
                    "AFBROS Donor Details Verification OTP",

                html: `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 500px;
                        margin: auto;
                        padding: 30px;
                        border: 1px solid #e6ebe8;
                        border-radius: 14px;
                        background: #ffffff;
                    ">

                        <h2 style="
                            margin-top: 0;
                            color: #198754;
                        ">
                            AFBROS Donor Verification
                        </h2>

                        <p>
                            You requested to update your
                            AFBROS donor information.
                        </p>

                        <p>
                            Your verification code is:
                        </p>

                        <div style="
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            padding: 15px;
                            margin: 20px 0;
                            background: #f3f8f5;
                            color: #198754;
                            text-align: center;
                            border-radius: 8px;
                        ">
                            ${otp}
                        </div>

                        <p>
                            This OTP will expire in
                            <strong>10 minutes</strong>.
                        </p>

                        <p>
                            If you did not request this change,
                            you can safely ignore this email.
                        </p>

                        <hr style="
                            border: none;
                            border-top: 1px solid #e6ebe8;
                            margin: 25px 0;
                        ">

                        <small style="
                            color: #849089;
                        ">
                            AFBROS Finance System
                            <br>
                            afbros@nexvertex.dev
                        </small>

                    </div>
                `

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
                "Failed to send OTP email"
            );

        }


        console.log(
            "AFBROS OTP EMAIL SENT:",
            data?.id
        );


        return data;

    };


module.exports =
    sendOTPEmail;