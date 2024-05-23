import { LLogger } from "../../LLogger/LLogger";

const someAsyncFunction = async (logger: LLogger) => {
  logger.info(`Right before we wait [this will show up in the console]`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  logger.info(`Right after before we throw [this will show up in the console]`);
};

const main = async () => {
  const logger = new LLogger("AsyncFunctionExample", {
    userId: "123",
  });
  await logger.runInAsyncContext(async () => {
    await someAsyncFunction(logger);
    throw new Error(`Some crazy Error`);
  });
};

main();
