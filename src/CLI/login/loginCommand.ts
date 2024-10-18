import { execSync } from "child_process";
import colors from "colors";
import fs from "fs";
import os from "os";
import path from "path";
import { LX_API_KEY } from "../consts";
import { openBrowser, promptUser } from "../utils";

export const loginHandler = async () => {
  if (LX_API_KEY !== undefined) {
    const response = await promptUser(
      `${colors.yellow(
        "🚨 It looks like you have already logged in. If you want to re-login, please press 1\n"
      )}`
    );
    if (response !== "1") {
      console.log(`${colors.red("Login cancelled")}`);
      return;
    }
  }

  /**
   * We need to direct the user to the browser to get an API key
   */
  console.log(
    `${colors.cyan(
      `We will redirect you to the lytix console to get an API key. `
    )}`
  );
  console.log(
    `${colors.cyan(
      `Once you have the API key, you can use it to authenticate your Lytix CLI. `
    )}`
  );

  // Open the browser to the lytix console
  openBrowser("https://lab.lytix.co/home/settings/api-keys");

  /**
   * Now as the user for an API key
   */
  const apiKey = await promptUser(`${colors.cyan("Enter your API key:")}`);

  /**
   * Now add this as an env var to the users bashrc or zshrc depending on what exists
   */
  const homeDir = os.homedir();
  const shellConfigFiles = [".zshrc", ".bashrc"];
  let configFile;

  for (const file of shellConfigFiles) {
    const filePath = path.join(homeDir, file);
    if (fs.existsSync(filePath)) {
      configFile = filePath;
      break;
    }
  }

  if (configFile) {
    try {
      // Read the current content of the config file
      let fileContent = fs.readFileSync(configFile, "utf8");

      // Remove any existing LX_API_KEY export
      fileContent = fileContent.replace(/^export LX_API_KEY=.*$/m, "");

      // Append the new LX_API_KEY export
      fileContent += `\nexport LX_API_KEY=${apiKey}\n`;

      // Write the updated content back to the file
      fs.writeFileSync(configFile, fileContent);

      console.log(
        colors.green(`API key updated in ${path.basename(configFile)}`)
      );

      // Automatically apply the changes
      const shell = process.env.SHELL || "/bin/bash";
      const command = `${shell} -c 'source ${configFile} && env'`;
      const result = execSync(command, { encoding: "utf-8" });
      const envVars = result.split("\n").reduce((acc, line) => {
        const [key, value] = line.split("=");
        // @ts-ignore
        if (key) acc[key] = value;
        return acc;
      }, {});

      Object.assign(process.env, envVars);

      console.log(
        colors.green(
          `Changes applied successfully. Please restart your terminal or run ${colors.bold(
            `source ${configFile}`
          )} to apply the changes.`
        )
      );
    } catch (error) {
      console.error(
        colors.red(
          `Error adding API key to ${path.basename(
            configFile
          )}: ${error}. Please contact support@lytix.co if this persists.`
        )
      );
    }
  } else {
    console.error(colors.red("Could not find .zshrc or .bashrc file"));
  }
};
