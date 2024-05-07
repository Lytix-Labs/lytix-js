import express from "express";
import { LLogger } from "../../LLogger/LLogger";
import httpContext from "express-http-context";
import { AnalyticRequestHandler } from "../../AnalyticRequestHandler/AnalyticRequestHandler";

const mmLogger = new LLogger("ExpressExample");

const app = express();

/**
 * This handle is used to push basic HTTP metrics
 */
app.use((req, res, next) => {
  return AnalyticRequestHandler(req, res, next, mmLogger);
});

/**
 * HTTP Context middlware
 */
app.use(httpContext.middleware);

app.get("/test", async (req, res) => {
  /**
   * Lets pretend an error happend
   */
  try {
    mmLogger.info("Some process is starting");
    throw new Error("An unexpeted error");
  } catch (err) {
    mmLogger.error("crazy unexpeted error with this user: 123", err);
    res.sendStatus(500);
    return;
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
