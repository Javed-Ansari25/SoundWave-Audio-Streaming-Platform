import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
    windowMs : 10 * 60 * 1000,
    max: 7,
    message : {
        success: false,
        message: "Too many login attempts. Try again after 10 minutes"
    },
    standardHeaders : true, // Sends rate limit info in response headers
    legacyHeaders: false    // Disables old headers
})

export default loginLimiter
