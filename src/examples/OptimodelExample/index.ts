import {
  AWSBedrockCredentials,
  ModelTypes,
  OpenAICredentials,
  SpeedPriority,
} from "../../Optimodel/Optimodel.types";
import { queryModel } from "../../Optimodel/QueryModel";

/**
 * Simple validator to check if the response is JSON
 */
function validator(x: string): boolean {
  try {
    JSON.parse(x);
    return true;
  } catch {
    return false;
  }
}

const main = async () => {
  const prompt = "Hello How are you?";
  const response = await queryModel({
    model: ModelTypes.gpt_4o_mini,
    messages: [
      { role: "user", content: prompt },
      { role: "system", content: "Always respond with a JSON object" },
    ],
    speedPriority: SpeedPriority.low,
    temperature: 0.5,
    fallbackModels: [ModelTypes.gpt_4o],
    validator: validator,
    maxGenLen: 256,
  });
  console.log(`Got response: ${response}`);
};

const mainWithManualCreds = async () => {
  const awsCreds: AWSBedrockCredentials = {
    awsAccessKeyId: "YOUR_AWS_ACCESS_KEY_ID",
    awsSecretKey: "YOUR_AWS_SECRET_KEY",
    awsRegion: "YOUR_AWS_REGION",
  };

  const openAICreds: OpenAICredentials = {
    openAiKey: "YOUR_OPENAI_API_KEY",
  };
  const prompt = "Hello How are you?";
  const response = await queryModel({
    model: ModelTypes.gpt_4o_mini,
    messages: [{ role: "user", content: prompt }],
    credentials: [awsCreds, openAICreds],
  });
  console.log(`Got response: ${response}`);
};

main();
