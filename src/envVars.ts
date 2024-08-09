class LytixEnvVars {
  LX_API_KEY: string;
  LX_BASE_URL: string;

  constructor() {
    this.LX_API_KEY = process.env.LX_API_KEY ?? "";
    this.LX_BASE_URL = process.env.LX_BASE_URL ?? "https://api.lytix.co";
  }

  validate(): void {
    if (!this.LX_API_KEY) {
      console.error(
        `Lytix ERROR: Missing: LX_API_KEY. Please make sure to set it via LytixCreds.setAPIKey() before making any calls`
      );
    }

    if (!this.LX_BASE_URL) {
      console.error(`Lytix ERROR: Missing: LX_BASE_URL`);
    }
  }

  setAPIKey(apiKey: string): void {
    this.LX_API_KEY = apiKey;
  }

  setBaseURL(baseURL: string): void {
    this.LX_BASE_URL = baseURL;
  }
}

/**
 * Always validate when importing this file
 * @note This will not hard break, just console.error
 */
const LytixCreds = new LytixEnvVars();
LytixCreds.validate();

export default LytixCreds;
