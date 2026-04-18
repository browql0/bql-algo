/* global process */
import express from "express";
import { handleSubmitRequest } from "./submitHandler.js";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json({ limit: "128kb" }));

app.all("/api/submit", async (req, res) => {
  const result = await handleSubmitRequest({
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  res.status(result.status).set(result.headers).json(result.body);
});

app.listen(port, () => {
  console.log(`BQL submission server listening on http://localhost:${port}`);
});
