export const MM_BASE_URL =
  process.env.MM_API_URL ?? "https://btszl.getsparechange.com";
export const MM_API_KEY = process.env.MM_API_KEY ?? "";

function validate(): void {
  if (!MM_API_KEY) {
    console.error(`MetricMongrel ERROR: Missing: MM_API_KEY`);
  }

  if (!MM_BASE_URL) {
    console.error(`MetricMongrel ERROR: Missing: MM_BASE_URL`);
  }
}

/**
 * Always validate when importing this file
 * @note This will not hard break, just console.error
 */
validate();
