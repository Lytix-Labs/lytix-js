import colors from "colors";
import fs from "fs/promises";
import path from "path";
import { Argv } from "yargs";
import { LX_CLI_API_KEY } from "../consts";
import runAgentSuite from "./runAgentSuite";
import TestUtils from "./test.Utils";

const verifyAPIKey = async () => {
  if (!LX_CLI_API_KEY) {
    console.log(
      colors.red("API key is not found. Please run 'lytix login' first!")
    );
    process.exit(1);
  }
};

export const testCommandBuilder = (yargs: Argv) => {
  return yargs
    .command(
      "run",
      "Run a test via Agent-as-a-Judge",
      (yargs) => {
        return yargs.option("suiteName", {
          type: "string",
          description: "The suite to test",
          demandOption: true,
        });
      },
      async (argv) => {
        await testAgentHandler(argv);
      }
    )
    .command(
      "create-suite",
      "Create a new suite",
      (yargs) => {
        return yargs.option("suiteName", {
          type: "string",
          description: "The name of the suite to create",
          demandOption: true,
        });
      },
      async (argv) => {
        await createSuiteHandler(argv);
      }
    )
    .command(
      "add-test",
      "Add a test to the suite",
      (yargs) => {
        return yargs
          .option("testName", {
            type: "string",
            description: "The name of the test to add",
            demandOption: true,
          })
          .option("suiteName", {
            type: "string",
            description: "The suite to add the test to",
            demandOption: true,
          });
      },
      async (argv) => {
        await addTestHandler(argv);
      }
    );
};

const testAgentHandler = async (argv: any) => {
  await verifyAPIKey();

  const { suiteName } = argv;
  if (!suiteName) {
    console.log(colors.red("Suite is required"));
    process.exit(1);
  }

  /**
   * Validate the suite exists
   */
  const testSuiteFolders = await TestUtils.getSuiteFolders(suiteName);
  if (testSuiteFolders.length === 0) {
    console.log(colors.red("Suite not found"));
    process.exit(1);
  }

  console.log(
    colors.cyan(`Starting test suite: `) +
      colors.green(suiteName) +
      colors.cyan(" via Agent-as-a-Judge...\n")
  );
  await runAgentSuite({ suite: suiteName });
};

const addTestHandler = async (argv: any) => {
  const { testName, suiteName } = argv;

  /**
   * First see if we can find the test suite folder
   */
  const testSuiteFolder = await TestUtils.getSuiteFolders(suiteName);

  /**
   * Make sure we dont have a test with the same name
   */
  if (testSuiteFolder.includes(testName)) {
    console.log(colors.red("Test with that name already exists"));
    process.exit(1);
  }

  /**
   * Otherwise create the folder
   */
  console.log(
    colors.cyan(`Creating test: `) + colors.green(testName) + colors.cyan("...")
  );
  await fs.mkdir(
    path.join(process.cwd(), "lytix-agent-tests", suiteName, testName)
  );

  /**
   * And then create a `start.py` file
   */
  const START_PY_CONTENTS = `import asyncio
import json


async def start():
    """
    Start the test and print the results to the console
    """
    toReturn = {
        "output": "Output of your model",
        "messages": [
            {
                "id": 1,
                "content": "Some query here?",
                "role": "user",
            }
        ],
        "sources": ["/sources/used/here"],
    }
    # Make sure to ONLY print the json
    print(json.dumps(toReturn))


if __name__ == "__main__":
    asyncio.run(start())
`;
  await fs.writeFile(
    path.join(
      process.cwd(),
      "lytix-agent-tests",
      suiteName,
      testName,
      "start.py"
    ),
    START_PY_CONTENTS
  );

  console.log(
    colors.green("🍾 Test created successfully!") +
      colors.cyan(` Remember to configure the setup.py file!`)
  );
};

const createSuiteHandler = async (argv: any) => {
  const { suiteName } = argv;

  /**
   * First lets make sure the suite name is not already taken
   */
  const testSuiteFolders = await TestUtils.getSuiteFolders(suiteName, true);
  if (testSuiteFolders.length > 0) {
    console.log(colors.red("Suite with that name already exists"));
    process.exit(1);
  }

  /**
   * Otherwise create the folder
   */
  console.log(
    colors.cyan(`Creating suite: `) +
      colors.green(suiteName) +
      colors.cyan("...")
  );
  await fs.mkdir(path.join(process.cwd(), "lytix-agent-tests", suiteName));

  /**
   * And then create a `config.json` file
   */
  await fs.writeFile(
    path.join(process.cwd(), "lytix-agent-tests", suiteName, "config.json"),
    JSON.stringify({
      repository: {
        remote: "github",
        branch: "main",
        repository: "Some/repo",
      },
    })
  );

  console.log(
    colors.green("🍾 Suite created successfully!") +
      colors.cyan(` Remember to configure the config.json file!`)
  );
};
