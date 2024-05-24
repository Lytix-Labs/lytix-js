import { LLogger } from "../../LLogger/LLogger";
import backgroundProcess from "./backgroundProcessExample";

const logger = new LLogger("mainEntrypoint");

const main = async () => {
  logger.info(`Log from the main process`);
  await backgroundProcess();
};

/**
 * All we need to do is wrap our entrypoint and everything will
 * be accessable
 */
logger.runInAsyncContext(main);
