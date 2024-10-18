import colors from "colors";
import diff from "deep-diff";
import fs from "fs";
import HttpClient from "../HttpClient/HttpClient";

export interface PromptUpstream {
  prompt: {
    id?: string;
    promptName: string;
    promptDescription: string;
  };
  promptVersion: {
    modelPrompt: string;
    userPrompt: string;
  };
}

class _SyncClient {
  /**
   * Relative folder where prompts are stored
   */
  private lytixPromptFolder: string = "lytix-prompts";

  constructor() {}

  /**
   * Init a projects, check if the relative folder exists, if not, create it
   */
  async initProject() {
    if (!fs.existsSync(this.lytixPromptFolder)) {
      console.log(colors.cyan("New project detected! Initializing..."));
      fs.mkdirSync(this.lytixPromptFolder);
    }
  }

  /**
   * Take in a list of upstream prompts, and sync it locally
   */
  async syncUpstreamPrompts(args: {
    prompts: PromptUpstream[];
    force: boolean;
    noLogs?: boolean;
  }) {
    const { prompts, force, noLogs = false } = args;

    // Initialize project
    await this.initProject();

    if (force) {
      if (!noLogs) {
        console.log(
          colors.yellow(
            "🚨 --force flag passed, ignoring local changes and overwriting..."
          )
        );
      }
    } else {
      // Check for differences
      const differences = await this.checkForDifferences(prompts);
      if (differences.length > 0) {
        console.log(colors.yellow("Changes detected:\n"));
        this.showGitLikeDiff(differences);
        if (!noLogs) {
          console.log(
            colors.red(
              '\nChanges detected. Please commit your changes using "lytix prompts commit" or pass in the --force flag to overwrite local changes'
            )
          );
        }
        process.exit(1);
      }
    }

    // Sync prompts
    prompts.forEach((prompt) => {
      const folderName = `${this.lytixPromptFolder}/${prompt.prompt.promptName}`;

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }

      // Write prompt.json
      const promptJson = {
        id: prompt.prompt.id,
        promptName: prompt.prompt.promptName,
        promptDescription: prompt.prompt.promptDescription,
      };
      fs.writeFileSync(
        `${folderName}/prompt.json`,
        JSON.stringify(promptJson, null, 2)
      );

      // Write systemPrompt.txt
      fs.writeFileSync(
        `${folderName}/systemPrompt.txt`,
        prompt.promptVersion.modelPrompt
      );

      // Write userPrompt.txt
      fs.writeFileSync(
        `${folderName}/userPrompt.txt`,
        prompt.promptVersion.userPrompt
      );
    });

    if (!noLogs) {
      console.log(colors.green("Prompts synced successfully!"));
    }
  }

  /**
   * Check for differences between local and upstream prompts
   * And attempt to commit them
   */
  async commitPrompts(args: { prompts: PromptUpstream[] }) {
    const { prompts } = args;

    // Check for differences
    const differences = await this.checkForDifferences(prompts, false);
    if (differences.length > 0) {
      console.log(colors.yellow("Changes detected:\n"));
      this.showGitLikeDiff(differences);
    } else {
      console.log(colors.green("No changes detected!"));
      process.exit(0);
      return;
    }

    /**
     * Now lets convert all the folders and text files into json
     */
    const updatedPrompts: PromptUpstream[] = [];

    for (const prompt of prompts) {
      const folderName = `${this.lytixPromptFolder}/${prompt.prompt.promptName}`;

      if (fs.existsSync(folderName)) {
        const promptJson = JSON.parse(
          fs.readFileSync(`${folderName}/prompt.json`, "utf8")
        );
        const systemPrompt = fs.readFileSync(
          `${folderName}/systemPrompt.txt`,
          "utf8"
        );
        const userPrompt = fs.readFileSync(
          `${folderName}/userPrompt.txt`,
          "utf8"
        );

        updatedPrompts.push({
          prompt: {
            id: promptJson.id,
            promptName: promptJson.promptName,
            promptDescription: promptJson.promptDescription,
          },
          promptVersion: {
            modelPrompt: systemPrompt,
            userPrompt: userPrompt,
          },
        });
      }
    }

    /**
     * Now lets send this to the server so we can update the prompt
     */

    const updatedPromptsUpstream = await HttpClient.pushPrompts(updatedPrompts);

    /**
     * Now sync prompts with the result
     */
    await this.syncUpstreamPrompts({
      prompts: updatedPromptsUpstream,
      force: true,
      noLogs: true,
    });

    console.log(colors.green("Prompts committed successfully! 🪩"));
  }

  private async checkForDifferences(
    upstreamPrompts: any[],
    reverseDirection: boolean = true
  ): Promise<diff.Diff<any>[]> {
    let differences: diff.Diff<any>[] = [];

    for (const prompt of upstreamPrompts) {
      const folderName = `${this.lytixPromptFolder}/${prompt.prompt.promptName}`;

      if (fs.existsSync(folderName)) {
        // Check prompt.json
        const localPromptJson = JSON.parse(
          fs.readFileSync(`${folderName}/prompt.json`, "utf8")
        );
        const upstreamPromptJson = {
          id: prompt.prompt.id,
          promptName: prompt.prompt.promptName,
          promptDescription: prompt.prompt.promptDescription,
        };
        differences = differences.concat(
          reverseDirection
            ? diff(upstreamPromptJson, localPromptJson) || []
            : diff(localPromptJson, upstreamPromptJson) || []
        );

        // Check systemPrompt.txt
        const localSystemPrompt = fs.readFileSync(
          `${folderName}/systemPrompt.txt`,
          "utf8"
        );
        differences = differences.concat(
          reverseDirection
            ? diff(prompt.promptVersion.modelPrompt, localSystemPrompt) || []
            : diff(localSystemPrompt, prompt.promptVersion.modelPrompt) || []
        );

        // Check userPrompt.txt
        const localUserPrompt = fs.readFileSync(
          `${folderName}/userPrompt.txt`,
          "utf8"
        );
        differences = differences.concat(
          reverseDirection
            ? diff(prompt.promptVersion.userPrompt, localUserPrompt) || []
            : diff(localUserPrompt, prompt.promptVersion.userPrompt) || []
        );
      } else {
        // New prompt
        // @ts-ignore
        differences.push({
          kind: reverseDirection ? "D" : "N",
          path: [prompt.prompt.promptName],
          // @ts-ignore
          [reverseDirection ? "lhs" : "rhs"]: "New prompt",
        });
      }
    }

    return differences;
  }

  private showGitLikeDiff(differences: diff.Diff<any>[]) {
    const groupedDifferences: { [promptName: string]: diff.Diff<any>[] } = {};

    // Group differences by prompt name
    differences.forEach((difference) => {
      const promptName = difference.path?.[0] || "Unknown";
      if (!groupedDifferences[promptName]) {
        groupedDifferences[promptName] = [];
      }
      groupedDifferences[promptName].push(difference);
    });

    // Display grouped differences
    Object.entries(groupedDifferences).forEach(([promptName, diffs], index) => {
      if (index > 0) {
        console.log("\n" + colors.gray("─".repeat(40)) + "\n");
      }
      console.log(
        colors.cyan(colors.bold(`Changes for prompt: ${promptName}\n`))
      );

      diffs.forEach((difference) => {
        const path = difference.path?.slice(1).join(".") || "";
        const fullPath = path ? `${promptName}.${path}` : promptName;

        switch (difference.kind) {
          case "N":
            console.log(
              colors.green(`+ ${fullPath}: ${JSON.stringify(difference.rhs)}`)
            );
            break;
          case "D":
            console.log(
              colors.red(`- ${fullPath}: ${JSON.stringify(difference.lhs)}`)
            );
            break;
          case "E":
            console.log(colors.yellow(`~ ${fullPath}:`));
            console.log(colors.red(`-  ${JSON.stringify(difference.lhs)}`));
            console.log(colors.green(`+  ${JSON.stringify(difference.rhs)}`));
            break;
          case "A":
            if (difference.item.kind === "N") {
              console.log(
                colors.green(
                  `+ ${fullPath}[${difference.index}]: ${JSON.stringify(
                    difference.item.rhs
                  )}`
                )
              );
            } else if (difference.item.kind === "D") {
              console.log(
                colors.red(
                  `- ${fullPath}[${difference.index}]: ${JSON.stringify(
                    difference.item.lhs
                  )}`
                )
              );
            }
            break;
        }
      });
    });
  }
}

const SyncClient = new _SyncClient();
export default SyncClient;
