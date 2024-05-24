import { LErrorIncrement, LLogger } from "../..";

/**
 * An example background process
 */
const backgroundProcess = async () => {
  const logger = new LLogger("backgroundProcessExample", { userId: "123" });
  try {
    logger.info("Background process started for user!");
    throw new Error("Unexpected error!");
  } catch (err) {
    /**
     * Just increment to get the logs as well as the error
     */
    logger.error(`Unexpected error happened`, err);
    LErrorIncrement("Unexpected error");
  }
};

export default backgroundProcess;
