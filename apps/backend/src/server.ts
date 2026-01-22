import express from "express";
import { ageRouter } from "./routes/ageRouter";

const app = express();
const port = 3001;

app.use(express.json());
app.use("/age", ageRouter);

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
