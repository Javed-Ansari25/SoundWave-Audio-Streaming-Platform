import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(cookieParser());
app.use(express.static("public"));

// import route 
import artistRouter from "./route/artist.route.js"
import authRouter from "./route/auth.route.js"
import userRouter from "./route/user.route.js"
import adminRouter from "./route/admin.route.js"

// route declaration
app.use("/api/v1/artist", artistRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/music", userRouter);
app.use("/api/v1/admin", adminRouter);


// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});

export default app
