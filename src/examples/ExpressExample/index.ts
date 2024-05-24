import express from "express";
import LError from "../../LError/LError";
import { LLogger } from "../../LLogger/LLogger";
import { LytixRequestWrapper } from "../../LytixRequestWrapper/LytixRequestWrapper";

const mmLogger = new LLogger("ExpressExample");

const app = express();

/**
 * This handle is used to push basic HTTP metrics
 * @note The last arg is used to capture the request data
 */
app.use((req, res, next) => {
  return LytixRequestWrapper(req, res, next, true);
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
