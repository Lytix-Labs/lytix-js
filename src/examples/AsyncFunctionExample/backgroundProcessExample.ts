import { LError, LLogger } from "../..";

/**
 * An example background process
 */
const backgroundProcess = async () => {
  const logger = new LLogger("backgroundProcessExample", { userId: "123" });
  logger.info("Background process started for user!");
  await new Promise((resolve) => setTimeout(resolve, 1000));
  logger.warn("We can warn to let folks know we see an error coming up!");
  throw new LError("exampleError", { userId: "123" });
  logger.info("Background process ended");
};

export default backgroundProcess;
