import colors from "colors";
import diff from "deep-diff";
import fs from "fs";
import HttpClient from "../HttpClient/HttpClient";

enum SavedPromptVariableType {
  STRING = "STRING",
  NUMBER = "NUMBER",
  BOOLEAN = "BOOLEAN",
}
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
  variables: {
    variableName: string;
    variableType: SavedPromptVariableType;
  }[];
}

class _SyncClient {
  /**
   * Relative folder where prompts are stored
   */
  private lytixPromptFolder: string = "lytix-prompts";

  constructor() {}

  async getPromptIdFromPromptName(promptName: string) {
    const folderPath = `${this.lytixPromptFolder}/${this.formatFolderName(
      promptName
    )}`;
    const promptJson = JSON.parse(
      fs.readFileSync(`${folderPath}/prompt.json`, "utf8")
    );
    try {
      return promptJson["id"];
    } catch (e) {
      console.log(
        colors.red(
          `Error getting prompt id for ${promptName}. Are you sure this prompt exists locally?`
        )
      );
      process.exit(1);
    }
  }

  /**
   * Init a projects, check if the relative folder exists, if not, create it
   */
  async initProject(): Promise<boolean> {
    if (!fs.existsSync(this.lytixPromptFolder)) {
      console.log(colors.cyan("New project detected! Initializing..."));
      fs.mkdirSync(this.lytixPromptFolder);
      return true;
    }
    return false;
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
    const newProject = await this.initProject();

    if (newProject === false) {
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
    }

    // Get list of existing local prompt folders
    const localPromptFolders = fs.readdirSync(this.lytixPromptFolder);

    // Create a set of upstream prompt names for quick lookup
    const upstreamPromptNames = new Set(
      prompts.map((p) => this.formatFolderName(p.prompt.promptName))
    );

    // Delete local folders that don't exist upstream
    localPromptFolders.forEach((folderName) => {
      if (!upstreamPromptNames.has(folderName)) {
        const folderPath = `${this.lytixPromptFolder}/${folderName}`;
        fs.rmSync(folderPath, { recursive: true, force: true });
        if (!noLogs) {
          console.log(colors.yellow(`Deleted local folder: ${folderName}`));
        }
      }
    });

    // Sync prompts
    prompts.forEach((prompt) => {
      const folderName = `${this.lytixPromptFolder}/${this.formatFolderName(
        prompt.prompt.promptName
      )}`;

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName, { recursive: true });
      }

      // Write prompt.json
      const promptJson = {
        id: prompt.prompt.id,
        promptName: prompt.prompt.promptName,
        promptDescription: prompt.prompt.promptDescription,
        variables: prompt.variables.map((d) => {
          return {
            type: d.variableType,
            name: d.variableName,
          };
        }),
      };
      fs.writeFileSync(
        `${folderName}/prompt.json`,
        JSON.stringify(promptJson, null, 2)
      );

      /**
       * Now create a typescript file, that will be used as the input for the prompt
       */
      const typesFileContent = `export interface ${this.formatFolderName(
        prompt.prompt.promptName
      )}Input {
  ${prompt.variables
    .map(
      (d) =>
        `${d.variableName}: ${
          d.variableType === SavedPromptVariableType.STRING
            ? "string"
            : d.variableType === SavedPromptVariableType.NUMBER
            ? "number"
            : "boolean"
        };`
    )
    .join("\n")}
}`;
      const typescriptFile = `${folderName}/${this.formatFolderName(
        prompt.prompt.promptName
      )}.prompt.types.ts`;
      fs.writeFileSync(typescriptFile, typesFileContent);

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
      const folderName = `${this.lytixPromptFolder}/${this.formatFolderName(
        prompt.prompt.promptName
      )}`;

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

        /**
         * Validate each variables
         */
        for (const variableEntry of promptJson.variables ?? []) {
          try {
            this.validateVariableEntry(variableEntry);
          } catch (e) {
            console.log(
              colors.red(
                `Error validating variables passed into: ${prompt.prompt.promptName}: ${e}`
              )
            );
            process.exit(1);
          }
        }

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
          variables: promptJson.variables ?? [],
        });
      }
    }

    /**
     * Now lets send this to the server so we can update the prompt
     */
    if (updatedPrompts.length === 0) {
      console.log(colors.red("No changes to commit!"));
      process.exit(0);
      return;
    }

    const updatedPromptsUpstream = await HttpClient.pushPrompts(updatedPrompts);

    /**
     * Now sync prompts with the result
     */
    await this.syncUpstreamPrompts({
      prompts: updatedPromptsUpstream,
      force: true,
      noLogs: true,
    });

    console.log(colors.green("\nPrompts committed successfully! 🪩"));
  }

  public formatFolderName(promptName: string) {
    return promptName.replaceAll(" ", "_");
  }

  public async checkForDifferences(
    upstreamPrompts: any[],
    reverseDirection: boolean = true
  ): Promise<diff.Diff<any>[]> {
    let differences: diff.Diff<any>[] = [];

    for (const prompt of upstreamPrompts) {
      const folderName = `${this.lytixPromptFolder}/${this.formatFolderName(
        prompt.prompt.promptName
      )}`;

      if (fs.existsSync(folderName)) {
        // Check prompt.json
        const localPromptJson = JSON.parse(
          fs.readFileSync(`${folderName}/prompt.json`, "utf8")
        );
        const upstreamPromptJson = {
          id: prompt.prompt.id,
          promptName: prompt.prompt.promptName,
          promptDescription: prompt.prompt.promptDescription,
          variables: prompt.variables.map(
            (d: { variableType: string; variableName: string }) => {
              return {
                type: d.variableType,
                name: d.variableName,
              };
            }
          ),
        };
        const promptJsonDiffs = reverseDirection
          ? diff(upstreamPromptJson, localPromptJson) || []
          : diff(localPromptJson, upstreamPromptJson) || [];

        // Add path to each difference
        promptJsonDiffs.forEach((d) => {
          const newPath = [
            prompt.prompt.promptName,
            "prompt",
            ...(d.path || []),
          ];
          return { ...d, path: newPath };
        });
        differences = differences.concat(promptJsonDiffs);

        // Check systemPrompt.txt
        const localSystemPrompt = fs.readFileSync(
          `${folderName}/systemPrompt.txt`,
          "utf8"
        );
        const systemPromptDiffs = reverseDirection
          ? diff(prompt.promptVersion.modelPrompt, localSystemPrompt) || []
          : diff(localSystemPrompt, prompt.promptVersion.modelPrompt) || [];

        // Add path to each difference
        systemPromptDiffs.forEach((d) => {
          d.path = [prompt.prompt.promptName, "promptVersion", "modelPrompt"];
        });
        differences = differences.concat(systemPromptDiffs);

        // Check userPrompt.txt
        const localUserPrompt = fs.readFileSync(
          `${folderName}/userPrompt.txt`,
          "utf8"
        );
        const userPromptDiffs = reverseDirection
          ? diff(prompt.promptVersion.userPrompt, localUserPrompt) || []
          : diff(localUserPrompt, prompt.promptVersion.userPrompt) || [];

        // Add path to each differenpromptJsonDiffsce
        userPromptDiffs.forEach((d) => {
          d.path = [prompt.prompt.promptName, "promptVersion", "userPrompt"];
        });
        differences = differences.concat(userPromptDiffs);
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

  /**
   * Validate that an entry in the variable array is valid
   */
  private validateVariableEntry(toValidate: { type: string; name: string }) {
    /**
     * Make sure type is in the SavedPromptVariableType enum
     */
    const validTypes = Object.values(SavedPromptVariableType).filter(
      (value) => typeof value === "string"
    );
    if (
      !validTypes.includes(
        toValidate.type.toUpperCase() as SavedPromptVariableType
      )
    ) {
      throw new Error(
        `Invalid variable type: ${
          toValidate.type
        }. Valid types are: ${validTypes.join(", ")}`
      );
    }

    /**
     * Validate the name, make sure we have no spaces or special characters
     */
    if (!toValidate.name || toValidate.name.trim() === "") {
      throw new Error("Variable name cannot be empty");
    }

    const nameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(toValidate.name)) {
      throw new Error(
        "Variable name can only contain letters, numbers, and underscores, and must start with a letter or underscore"
      );
    }
  }
}

const SyncClient = new _SyncClient();
export default SyncClient;
