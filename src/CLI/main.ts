#!/usr/bin/env node
import colors from "colors";
import { hideBin } from "yargs/helpers";
import yargs from "yargs/yargs";
import { loginHandler } from "./login/loginCommand";
import { promptCommandBuilder } from "./prompt/promptCommand";
import { testCommandBuilder } from "./test/testCommand";

yargs(hideBin(process.argv))
  .scriptName("lytix")
  .command("prompt", "Manage and sync your lytix prompts", promptCommandBuilder)
  // .command("tests", "Manage and sync your lytix tests", testCommandBuilder)
  .command(
    "login",
    "Login to your lytix account",
    (yargs) => {
      return yargs;
    },
    async (argv) => {
      try {
        await loginHandler();
      } catch (error) {
        console.error(
          `${colors.red(
            `Login failed: ${error}. Please contact support@lytix.co if this persists.`
          )}`
        );
      }
    }
  )
  .command(
    "agent-test",
    "Manage and run your agentic tests",
    testCommandBuilder
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .demandCommand(1, "You need at least one command before moving on")
  .strict()
  .help()
  .parse();
