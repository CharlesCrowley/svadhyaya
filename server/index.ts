import path from "node:path";
import { fileURLToPath } from "node:url";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import express from "express";
import { env } from "./env.js";

const app = express();
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");
const hasBucket = Boolean(
  env.AWS_ENDPOINT_URL &&
  env.AWS_ACCESS_KEY_ID &&
  env.AWS_SECRET_ACCESS_KEY &&
  env.AWS_S3_BUCKET_NAME &&
  env.AWS_DEFAULT_REGION
);
const s3 = hasBucket
  ? new S3Client({
      endpoint: env.AWS_ENDPOINT_URL,
      region: env.AWS_DEFAULT_REGION,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
      }
    })
  : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "svadhyaya", environment: env.NODE_ENV });
});

if (s3) {
  app.get("/media/:filename", async (request, response) => {
    const filename = request.params.filename;
    if (!/^\d{2}-[a-z0-9-]+\.mp3$/.test(filename)) {
      response.sendStatus(404);
      return;
    }

    try {
      const object = await s3.send(new GetObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME!,
        Key: filename,
        ...(request.headers.range ? { Range: request.headers.range } : {})
      }));

      response.status(object.ContentRange ? 206 : 200);
      response.setHeader("Accept-Ranges", "bytes");
      response.setHeader("Content-Type", object.ContentType ?? "audio/mpeg");
      response.setHeader("Cache-Control", "private, max-age=3600");
      if (object.ContentLength !== undefined) response.setHeader("Content-Length", object.ContentLength);
      if (object.ContentRange) response.setHeader("Content-Range", object.ContentRange);
      if (object.ETag) response.setHeader("ETag", object.ETag);

      const body = object.Body as NodeJS.ReadableStream | undefined;
      if (!body) {
        response.sendStatus(404);
        return;
      }
      body.pipe(response);
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      response.sendStatus(status === 404 ? 404 : 502);
    }
  });
} else {
  app.use(
    "/media",
    express.static(path.join(projectRoot, "audio", "sections"), {
      acceptRanges: true,
      fallthrough: false,
      immutable: false,
      maxAge: env.NODE_ENV === "production" ? "1h" : 0
    })
  );
}

if (env.NODE_ENV === "production") {
  const clientDir = path.join(projectRoot, "dist", "client");
  app.use(express.static(clientDir));
  app.get("/{*path}", (_request, response) => response.sendFile(path.join(clientDir, "index.html")));
}

app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Svadhyaya server listening on http://localhost:${env.PORT}`);
});
