import { exec } from "child_process";
import colors from "colors";
import fs from "fs/promises";
import path from "path";
import HttpClient from "../HttpClient/HttpClient";
import { AgentAsJudgeTestRunTestResultsToTest } from "./test.types";
import TestUtils from "./test.Utils";

const runAgentSuite = async (args: { suite: string }) => {
  const { suite } = args;

  /**
   * Pull all the folders in the suite
   */
  const suiteFolders = await TestUtils.getSuiteFolders(suite);

  /**
   * Pull our the config and load it to a json object
   */
  const config = await TestUtils.getSuiteConfig(suite);

  /**
   * Loop over each folder and collect data for the test
   */
  const testResultsToTest: {
    testName: string;
    output: string;
    messages: { id: number; content: string; role: string }[];
    sources: string[];
  }[] = [];
  for (const folder of suiteFolders) {
    /**
     * Ensure the folder is a directory
     */
    const isDirectory = (
      await fs.stat(
        path.join(process.cwd(), "lytix-agent-tests", suite, folder)
      )
    ).isDirectory();
    if (!isDirectory) {
      continue;
    }

    /**
     * Run the start.py file to collect the test output
     */
    console.log(
      colors.cyan(`Starting to collect data for: `) +
        colors.green(folder) +
        colors.cyan("...")
    );
    const testResults = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        exec(
          `python3 ${path.join(
            process.cwd(),
            "lytix-agent-tests",
            suite,
            folder,
            "start.py"
          )}`,
          (error, stdout, stderr) => {
            if (error) {
              reject(error);
              return;
            }
            resolve({ stdout, stderr });
          }
        );
      }
    );
    console.log(
      colors.cyan("Collected output for: ") +
        colors.green(folder) +
        colors.cyan("!")
    );
    /**
     * Now lets validate the output
     */
    const parsedOutput = JSON.parse(testResults.stdout);

    /**
     * Make sure we have 'output', 'messages', and 'sources'
     */
    if (
      !parsedOutput["output"] ||
      !parsedOutput["messages"] ||
      !parsedOutput["sources"]
    ) {
      console.log(
        colors.red("Invalid output format for: ") +
          colors.green(folder) +
          colors.red("...") +
          colors.cyan("Skipping...")
      );
      continue;
    }
    testResultsToTest.push({
      testName: folder,
      output: parsedOutput["output"],
      messages: parsedOutput["messages"],
      sources: parsedOutput["sources"],
    });
  }

  console.log(
    colors.green(
      "\nLocal results collected 🍻, uploading and evaluating now...\n"
    )
  );
  const response = await HttpClient.startAgentAsJudgeTestRun({
    config,
    testResultsToTest,
  });
  const agentAsJudgeTestRunId = response["agentAsJudgeTestRunId"];

  /**
   * Now its time to wait for the test to complete
   */
  let results = await HttpClient.getAgentAsJudgeTestRun(agentAsJudgeTestRunId);
  let currentStatus = results["status"];
  const { default: ora } = await import("ora");
  const spinner = ora("Loading unicorns").start();
  spinner.color = "yellow";
  spinner.text =
    colors.cyan("Waiting for test to complete. Current status: ") +
    colors.green(currentStatus);

  while (results["status"] !== "SUCCESS" && results["status"] !== "FAILED") {
    // console.log(
    //   colors.cyan("Waiting for test to complete...Current status: ") +
    //     colors.green(results["status"]) +
    //     colors.cyan("...")
    // );
    await new Promise((resolve) => setTimeout(resolve, 2500));
    results = await HttpClient.getAgentAsJudgeTestRun(agentAsJudgeTestRunId);
    currentStatus = results["status"];
    spinner.text =
      colors.cyan("Waiting for test to complete. Current status: ") +
      colors.green(currentStatus);
  }
  spinner.stop();

  console.log(colors.green("Test completed 🍻, printing results...\n\n"));

  /**
   * Now just print the results
   */
  const resultsToTest: AgentAsJudgeTestRunTestResultsToTest =
    results["results"];

  for (const testResult of resultsToTest) {
    if (!testResult["score"] || !testResult["explanation"]) {
      console.log(
        colors.red("Test: ") +
          colors.green(testResult["testName"]) +
          colors.red(" has failed!")
      );
      continue;
    }

    /**
     * Print it
     */
    console.log(
      colors.green("Test Name: ") + colors.cyan(testResult["testName"])
    );
    console.log(
      colors.green("Score: ") + colors.cyan(`${testResult["score"]}/10`)
    );
    console.log(
      colors.green("Explanation: ") + colors.cyan(testResult["explanation"])
    );
    console.log(
      colors.green("Sources Missed: ") +
        colors.cyan((testResult["missedSources"] || []).join(", ") ?? "None")
    );
    console.log("\n");
  }
};

export default runAgentSuite;
