import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importing the router
import healthCheckRouter from "./routes/healthcheck.routes.js";
import authRouter from "./routes/auth.routes.js";
import noteRouter from "./routes/note.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";

const app = express();

app.use(cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE","OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization","Accept"],
    exposedHeaders: ["Authorization", "Set-Cookie", '*'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Using the router
// health check
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/note", noteRouter);
app.use("/api/v1/project", projectRouter);
app.use("/api/v1/task",taskRouter)

// if no route found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    data: null,
  });
});

export default app;
