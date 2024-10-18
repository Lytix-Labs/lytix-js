import colors from "colors";
import { Argv } from "yargs";
import HttpClient from "../HttpClient/HttpClient";
import SyncClient from "../SyncClient/SyncClient";

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
    );
};

const syncHandler = async (argv: any) => {
  const verbose = argv.verbose;
  const force = argv.force;
  console.log(colors.cyan("🔄 Syncing prompts from upstream..."));

  const prompts = await HttpClient.getAllPrompts();
  await SyncClient.syncUpstreamPrompts({ prompts, force });

  console.log(colors.green("✅ Synced prompts from upstream!"));
};

const commitHandler = async (argv: any) => {
  const verbose = argv.verbose;

  console.log(colors.cyan("🔄 Committing prompts to upstream..."));
  const upstreamPrompts = await HttpClient.getAllPrompts();
  await SyncClient.commitPrompts({ prompts: upstreamPrompts });
};
