import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { env } from "./env.js";

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "svadhyaya", environment: env.NODE_ENV });
});

app.use(
  "/media",
  express.static(path.join(projectRoot, "audio", "sections"), {
    acceptRanges: true,
    fallthrough: false,
    immutable: false,
    maxAge: env.NODE_ENV === "production" ? "1h" : 0
  })
);

if (env.NODE_ENV === "production") {
  const clientDir = path.join(projectRoot, "dist", "client");
  app.use(express.static(clientDir));
  app.get("/{*path}", (_request, response) => response.sendFile(path.join(clientDir, "index.html")));
}

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Svadhyaya server listening on http://localhost:${env.PORT}`);
});
