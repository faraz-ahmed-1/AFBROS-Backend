const {
    Resend
} = require("resend");


// ======================================================
// CONFIG
// ======================================================

if (
    !process.env.RESEND_API_KEY
) {

    console.warn(
        "RESEND_API_KEY is missing."
    );

}


const resend =
    new Resend(
        process.env.RESEND_API_KEY
    );


const FROM_EMAIL =
    process.env.RESEND_FROM_EMAIL ||
    "afbros@nexvertex.dev";


// ======================================================
// SEND DONOR UPDATE OTP
// ======================================================

const sendDonorUpdateOtp =
    async (
        recipientEmail,
        otp
    ) => {

        const {
            data,
            error
        } =
            await resend.emails.send({

                from:
                    `AFBROS <${FROM_EMAIL}>`,

                to: [
                    recipientEmail
                ],

                subject:
                    "AFBROS Donor Details Verification Code",

                html: `

                    <!DOCTYPE html>

                    <html>

                    <body
                        style="
                            margin:0;
                            padding:0;
                            background:#f5f7f6;
                            font-family:Arial,sans-serif;
                            color:#26372e;
                        "
                    >

                        <div
                            style="
                                max-width:560px;
                                margin:30px auto;
                                padding:30px;
                                background:#ffffff;
                                border:1px solid #e6ebe8;
                                border-radius:18px;
                            "
                        >

                            <h2
                                style="
                                    margin:0 0 8px;
                                    color:#198754;
                                "
                            >
                                AFBROS
                            </h2>

                            <p
                                style="
                                    margin:0 0 25px;
                                    color:#849089;
                                    font-size:13px;
                                "
                            >
                                Donor Details Verification
                            </p>


                            <p>
                                A request was received to update your
                                AFBROS donor information.
                            </p>


                            <p>
                                Enter this verification code:
                            </p>


                            <div
                                style="
                                    margin:24px 0;
                                    padding:20px;
                                    text-align:center;
                                    background:#f3f8f5;
                                    border-radius:12px;
                                    font-size:30px;
                                    font-weight:700;
                                    letter-spacing:8px;
                                    color:#198754;
                                "
                            >
                                ${otp}
                            </div>


                            <p>
                                This code expires in
                                <strong>10 minutes</strong>.
                            </p>


                            <p
                                style="
                                    margin-top:25px;
                                    color:#849089;
                                    font-size:12px;
                                    line-height:1.6;
                                "
                            >
                                If you did not request this change,
                                ignore this email. Your donor information
                                will remain unchanged.
                            </p>


                            <hr
                                style="
                                    margin:25px 0;
                                    border:none;
                                    border-top:1px solid #e6ebe8;
                                "
                            />


                            <p
                                style="
                                    margin:0;
                                    color:#849089;
                                    font-size:11px;
                                "
                            >
                                AFBROS Finance System
                            </p>

                        </div>

                    </body>

                    </html>

                `

            });


        if (error) {

            console.error(
                "RESEND ERROR:",
                error
            );


            throw new Error(
                error.message ||
                "Unable to send verification email."
            );

        }


        return data;

    };


module.exports = {
    sendDonorUpdateOtp
};