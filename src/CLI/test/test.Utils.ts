import colors from "colors";
import fs from "fs/promises";
import path from "path";
/**
 * Get the suite folders
 */
const getSuiteFolders = async (suite: string, createIfNotExists = false) => {
  /**
   * If no lytix-agent-tests folder exists, create it
   */
  try {
    await fs.access(path.join(process.cwd(), "lytix-agent-tests"));
  } catch {
    if (createIfNotExists) {
      await fs.mkdir(path.join(process.cwd(), "lytix-agent-tests"));
    } else {
      throw new Error("No lytix-agent-tests folder found");
    }
  }

  /**
   * Verify the suite folder exists
   */
  try {
    await fs.access(path.join(process.cwd(), "lytix-agent-tests", suite));
  } catch {
    return [];
  }

  const suiteFolders = await fs.readdir(
    path.join(process.cwd(), "lytix-agent-tests", suite)
  );

  /**
   * If there are any folders with the same name, throw an error
   */
  const uniqueSuiteFolders = new Set(suiteFolders);
  if (uniqueSuiteFolders.size !== suiteFolders.length) {
    console.log(colors.red("There are duplicate test names in the suite"));
    process.exit(1);
  }
  return suiteFolders;
};

/**
 * Get the suite config
 */
const getSuiteConfig = async (suite: string) => {
  const config = await fs.readFile(
    path.join(process.cwd(), "lytix-agent-tests", suite, "config.json"),
    "utf8"
  );
  return JSON.parse(config);
};

const TestUtils = {
  getSuiteFolders,
  getSuiteConfig,
};
export default TestUtils;
