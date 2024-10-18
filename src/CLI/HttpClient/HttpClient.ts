import colors from "colors";
import { LX_API_KEY } from "../consts";
import { PromptUpstream } from "../SyncClient/SyncClient";

class _HttpClient {
  private baseUrl: string;
  private apiKey: string;
  constructor(baseUrl: string) {
    this.baseUrl = `${baseUrl}/cli/v1/`;
    if (!LX_API_KEY) {
      console.log(
        colors.red("API key is not found. Please run 'lytix login' first!")
      );
      throw new Error("LX_API_KEY is not set");
    }
    this.apiKey = LX_API_KEY;
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
}

const HttpClient = new _HttpClient(
  process.env.LX_BASE_URL || "https://api.lytix.co/"
);
export default HttpClient;
