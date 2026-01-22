import { Router, Request, Response } from "express";
import { fetchAge } from "../agifyClient";

export const ageRouter = Router();

ageRouter.get("/", async (request: Request, response: Response) => {
  try {
    const name = request.query.name;
    const country = request.query.country_id
      ? String(request.query.country_id)
      : undefined;

    if (typeof name !== "string")
      return response.status(400).json({ error: "Name is required" });

    const data = await fetchAge(name, country);
    if (!data) return response.status(404).json({ error: "Age not found" });
    return response.json(data);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      response.status(500).json({ error: "Failed to fetch age" });
    } else throw err;
  }
});
