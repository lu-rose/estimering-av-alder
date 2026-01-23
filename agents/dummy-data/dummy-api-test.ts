import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

// Mock database
let estimations = [
  { id: 1, name: "Alice", age: 28, confidence: 0.92 },
  { id: 2, name: "Bob", age: 45, confidence: 0.78 },
  { id: 3, name: "Charlie", age: 34, confidence: 0.87 },
];

let nextId = 4;

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Age Estimation API", status: "running" });
});

app.get("/api/estimations", (req, res) => {
  res.json({ success: true, data: estimations });
});

app.get("/api/estimations/:id", (req, res) => {
  const estimation = estimations.find((e) => e.id === parseInt(req.params.id));
  if (!estimation) {
    return res.status(404).json({ success: false, error: "Not found" });
  }
  res.json({ success: true, data: estimation });
});

app.post("/api/estimations", (req, res) => {
  const { name } = req.body;
  const newEstimation = {
    id: nextId++,
    name: name || "Unknown",
    age: Math.floor(Math.random() * 50) + 20,
    confidence: +(Math.random() * 0.3 + 0.7).toFixed(2),
  };
  estimations.push(newEstimation);
  res.status(201).json({ success: true, data: newEstimation });
});

app.delete("/api/estimations/:id", (req, res) => {
  const index = estimations.findIndex((e) => e.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Not found" });
  }
  estimations.splice(index, 1);
  res.json({ success: true, message: "Deleted" });
});

app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
});
