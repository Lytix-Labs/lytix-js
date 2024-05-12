export const LX_BASE_URL = process.env.LX_BASE_URL ?? "https://api.lytix.co";
export const LX_API_KEY = process.env.LX_API_KEY ?? "";

function validate(): void {
  if (!LX_API_KEY) {
    console.error(`Lytix ERROR: Missing: LX_API_KEY`);
  }

  if (!LX_BASE_URL) {
    console.error(`Lytix ERROR: Missing: LX_BASE_URL`);
  }
}

/**
 * Always validate when importing this file
 * @note This will not hard break, just console.error
 */
validate();
