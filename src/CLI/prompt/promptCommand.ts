import colors from "colors";
import { Argv } from "yargs";
import { LX_CLI_API_KEY } from "../consts";
import HttpClient from "../HttpClient/HttpClient";
import SyncClient from "../SyncClient/SyncClient";
import { promptUser } from "../utils";

const verifyAPIKey = async () => {
  if (!LX_CLI_API_KEY) {
    console.log(
      colors.red("API key is not found. Please run 'lytix login' first!")
    );
    process.exit(1);
  }
};

export const promptCommandBuilder = (yargs: Argv) => {
  return yargs
    .command(
      "sync",
      "Sync upstream prompts locally",
      (yargs) => {
        return yargs.option("force", {
          type: "boolean",
          description: "Force sync from upstream, ignoring local changes",
          default: false,
        });
      },
      async (argv) => {
        await syncHandler(argv);
      }
    )
    .command(
      "commit",
      "Commit your local prompts to the upstream",
      (yargs) => {
        return yargs;
      },
      commitHandler
    )
    .command(
      "delete",
      "Delete a prompt from the upstream",
      (yargs) => {
        return yargs.option("promptName", {
          type: "string",
          description: "The name of the prompt to delete",
          demandOption: true,
        });
      },
      deleteHandler
    )
    .command(
      "create",
      "Create a new prompt",
      (yargs) => {
        return yargs.option("promptName", {
          type: "string",
          description: "The name of the prompt to create",
          demandOption: true,
        });
      },
      createHandler
    );
};

const deleteHandler = async (argv: any) => {
  await verifyAPIKey();

  /**
   * First make sure we have no local changes
   */
  const prompts = await HttpClient.getAllPrompts();
  const differences = await SyncClient.checkForDifferences(prompts);
  if (differences.length > 0) {
    console.log(
      colors.red(
        "Changes detected in local prompts! Please run `lytix prompt sync` first"
      )
    );
    process.exit(1);
  }

  const promptName = argv.promptName;
  /**
   * First confirm with the user
   */
  const confirmation = await promptUser(
    colors.yellow(
      `Are you sure you want to delete the prompt ` +
        colors.cyan(colors.bold(`"${promptName}"`)) +
        colors.yellow(`? (y/n)`)
    )
  );
  if (confirmation !== "y") {
    console.log(colors.red("❌ Prompt deletion cancelled."));
    process.exit(0);
  }

  /**
   * Get the promptId from the file, using the promptName
   */
  const promptId = await SyncClient.getPromptIdFromPromptName(promptName);

  console.log(colors.cyan("🔄 Deleting prompt from upstream..."));
  await HttpClient.deletePrompt(promptId);

  /**
   * Now refresh the local prompts
   */
  const promptsUpdated = await HttpClient.getAllPrompts();
  await SyncClient.syncUpstreamPrompts({
    prompts: promptsUpdated,
    force: false,
    noLogs: true,
  });

  console.log(colors.green("✅ Deleted prompt from upstream!"));
};

const createHandler = async (argv: any) => {
  await verifyAPIKey();

  /**
   * First make sure we have no local changes
   */
  const prompts = await HttpClient.getAllPrompts();
  const differences = await SyncClient.checkForDifferences(prompts);
  if (differences.length > 0) {
    console.log(
      colors.red(
        "Changes detected in local prompts! Please run `lytix prompt sync` first"
      )
    );
    process.exit(1);
  }

  const promptName = argv.promptName;
  console.log(
    colors.cyan(`🔄 Creating prompt: `) +
      colors.yellow(promptName) +
      colors.cyan(` in upstream...`)
  );

  await HttpClient.createPrompt(promptName);
  const promptsUpdated = await HttpClient.getAllPrompts();

  /**
   * Now refresh the local prompts
   */
  await SyncClient.syncUpstreamPrompts({
    prompts: promptsUpdated,
    // Force sync to ensure we have the latest prompt
    force: true,
    noLogs: true,
  });

  console.log(colors.green("🪩 Created prompt in upstream!"));
};

const syncHandler = async (argv: any) => {
  await verifyAPIKey();

  const verbose = argv.verbose;
  const force = argv.force;
  console.log(colors.cyan("🔄 Syncing prompts from upstream..."));

  const prompts = await HttpClient.getAllPrompts();
  await SyncClient.syncUpstreamPrompts({ prompts, force });

  console.log(colors.green("✅ Synced prompts from upstream!"));
};

const commitHandler = async (argv: any) => {
  await verifyAPIKey();

  const verbose = argv.verbose;

  console.log(colors.cyan("🔄 Committing prompts to upstream..."));
  const upstreamPrompts = await HttpClient.getAllPrompts();
  await SyncClient.commitPrompts({ prompts: upstreamPrompts });
};
