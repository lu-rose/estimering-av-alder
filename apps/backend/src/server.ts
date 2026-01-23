import express from "express";
import cors from "cors";
import { ageRouter } from "./routes/ageRouter";

const app = express();
const port = 3001;

// Enable CORS for frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Local environment URL
    credentials: true, // Allow cookies if needed
  })
);

app.use(express.json());
app.use("/age", ageRouter);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
