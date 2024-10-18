import colors from "colors";
import * as readline from "readline";

/**
 * Take a string input and prompt the user with it
 * @param input The prompt message to display to the user
 * @returns A Promise that resolves with the user's input
 */
const promptUser = (input: string): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(input, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

/**
 * Opens the default web browser with the specified URL.
 * @param url The URL to open in the browser.
 * @throws Will throw an error if the 'open' command is not available on the system.
 */
const openBrowser = (url: string): void => {
  const { exec } = require("child_process");
  exec(`open ${url}`, (error: Error | null) => {
    if (error) {
      console.error(colors.red(`Failed to open browser: ${error.message}`));
    }
  });
};

export { openBrowser, promptUser };
