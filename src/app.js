import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importing the router
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import noteRouter from "./routes/note.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Using the router
// health check
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/note", noteRouter);

export default app;
