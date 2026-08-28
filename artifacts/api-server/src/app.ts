import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { auth } from "./lib/auth";
import { isTrustedOrigin } from "./lib/origins";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      callback(null, !origin || isTrustedOrigin(origin));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/api/auth/*splat", async (req, res, next) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value);
    const response = await auth.handler(new Request(`${req.protocol}://${req.get("host")}${req.originalUrl}`, {
      method: req.method, headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    }));
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") res.append("set-cookie", value);
      else res.setHeader(key, value);
    });
    res.status(response.status).send(await response.text());
  } catch (error) { next(error); }
});

app.use("/api", router);

export default app;
