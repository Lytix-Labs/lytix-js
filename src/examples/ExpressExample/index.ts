import express from "express";
import { AnalyticRequestHandler } from "../../AnalyticRequestHandler/AnalyticRequestHandler";
import LError from "../../LError/LError";
import { LLogger } from "../../LLogger/LLogger";

const mmLogger = new LLogger("ExpressExample", { asyncContext: true });

const app = express();

/**
 * This handle is used to push basic HTTP metrics
 */
app.use((req, res, next) => {
  return AnalyticRequestHandler(req, res, next, mmLogger);
});

app.use((req, res, next) => {
  /**
   * Lets say we auth the user and get their UID
   */
  mmLogger.setMetadata({ key: "userId", value: "123" });
  next();
});

app.get("/test", async (req, res) => {
  /**
   * Lets pretend an error happend
   */
  try {
    mmLogger.info("Some process is starting");
    throw new LError("An unexpeted error", { env: "prod" });
  } catch (err) {
    mmLogger.error("crazy unexpeted error with this user: 123", err);
    // res.sendStatus(500);
    // return;
  }

  /**
   * Magically if we ended here, we'd reply with a 200
   */
  res.send("Hello World");
});

app
  .listen(8080, () => {
    mmLogger.info(`Server running at PORT: ${8080}`);
  })
  .on("error", (error) => {
    throw new Error(error.message);
  });
