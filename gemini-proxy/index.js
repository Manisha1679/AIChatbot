import express from "express";
import dotenv  from "dotenv";
import cors    from "cors";
import fetch   from "node-fetch";

dotenv.config();
const { GEMINI_API_KEY, PORT = 8080 } = process.env;

const app = express();
app.use(cors());           // in prod: cors({origin:"https://your-site"})
app.use(express.json());

app.post("/api/gemini", async (req, res) => {
  try {
    const geminiURL =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const proxyRes = await fetch(geminiURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    res.status(proxyRes.status);
    proxyRes.headers.forEach((v, k) => {
  const key = k.toLowerCase();
  if (!["content-encoding", "content-length", "transfer-encoding"].includes(key)) {
    res.setHeader(k, v);
  }
});

    proxyRes.body.pipe(res);              // stream back to client
  } catch (err) {
    res.status(500).json({ error: "Proxy error" });
  }
});

app.listen(PORT, () =>
  console.log(`Proxy listening on http://localhost:${PORT}`)
);
