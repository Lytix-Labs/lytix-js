import colors from "colors";
import { LX_CLI_API_KEY, LX_CLI_BASE_URL } from "../consts";
import { PromptUpstream } from "../prompt/SyncClient/SyncClient";
import {
  AgentAsJudgeTestRunConfig,
  AgentAsJudgeTestRunTestResultsToTest,
} from "../test/test.types";

class _HttpClient {
  private baseUrl: string;
  private apiKey: string;
  constructor(baseUrl: string) {
    this.baseUrl = `${baseUrl}/cli/v1/`;
    if (!LX_CLI_API_KEY) {
      console.log(
        colors.red("API key is not found. Please run 'lytix login' first!")
      );
    }
    this.apiKey = LX_CLI_API_KEY ?? "";
  }

  /**
   * Make a post request with a body to a given path
   */
  async post(path: string, body: any) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 200) {
      try {
        const json = await response.json();
        console.log(colors.red(json.message));
      } catch (e) {
        console.log(
          colors.red(
            `Error making https request: ${response.status} ${response.statusText}`
          )
        );
      }
      process.exit(1);
    }
    return response.json();
  }

  /**
   * Make a get request to a given path
   */
  async get(path: string) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (response.status !== 200) {
      try {
        const json = await response.json();
        console.log(colors.red(json.message));
      } catch (e) {
        console.log(
          colors.red(
            `Error making https request: ${response.status} ${response.statusText}`
          )
        );
      }

      process.exit(1);
    }
    return response.json();
  }

  /**
   * Get all prompts from upstream
   */
  async getAllPrompts() {
    return this.get("/savedPrompts");
  }

  /**
   * Push local prompts to upstream
   */
  async pushPrompts(prompts: PromptUpstream[]) {
    return await this.post("/updatePrompts", { promptsToUpdate: prompts });
  }

  /**
   * Delete a prompt from upstream
   */
  async deletePrompt(promptId: string) {
    return await this.post("/deletePrompt", { promptId });
  }

  /**
   * Create a new prompt in upstream
   */
  async createPrompt(promptName: string) {
    return await this.post("/createPrompt", { promptName });
  }

  /**
   * Start a agent as judge test run
   */
  async startAgentAsJudgeTestRun(toPost: {
    config: AgentAsJudgeTestRunConfig;
    testResultsToTest: AgentAsJudgeTestRunTestResultsToTest;
  }) {
    return await this.post("/startAgentAsJudgeTest", toPost);
  }

  async getAgentAsJudgeTestRun(agentAsJudgeTestRunId: string) {
    return await this.get(
      `/agentAsJudgeTestRunStatus/${agentAsJudgeTestRunId}`
    );
  }
}

const HttpClient = new _HttpClient(LX_CLI_BASE_URL || "https://api.lytix.co/");
export default HttpClient;
