import LytixCreds from "../envVars";
import {
  ModelMessage,
  ModelTypes,
  Providers,
  SpeedPriority,
} from "./Optimodel.types";

export async function queryModel(args: {
  model: ModelTypes;
  messages: ModelMessage[];
  speedPriority?: SpeedPriority;
  validator?: (response: string) => boolean;
  fallbackModels?: ModelTypes[];
  maxGenLen?: number;
  temperature?: number;
  jsonMode?: boolean;
  provider?: Providers;
}): Promise<any> {
  const {
    model,
    messages,
    speedPriority,
    validator,
    fallbackModels = [],
    maxGenLen,
    temperature,
    jsonMode,
    provider,
  } = args;
  try {
    const allModels = [model, ...fallbackModels];

    for (const [index, model] of allModels.entries()) {
      try {
        // Convert model enum to string
        const modelToUse = model.toString();

        const response = await fetch(
          `${LytixCreds.LX_BASE_URL.replace(/\/$/, "")}/optimodel/api/v1/query`,
          {
            method: "POST",
            body: JSON.stringify({
              modelToUse: modelToUse,
              messages: messages,
              speedPriority: speedPriority,
              maxGenLen: maxGenLen,
              temperature: temperature,
              jsonMode: jsonMode,
              provider: provider,
            }),
            headers: { Authorization: `Bearer ${LytixCreds.LX_API_KEY}` },
          }
        );

        const jsonResponse = await response.json();
        if (!jsonResponse.modelResponse) {
          throw new Error(`Bad request: ${JSON.stringify(jsonResponse)}`);
        }

        if (validator) {
          if (!validator(jsonResponse["modelResponse"])) {
            console.warn(`Failed validation when trying model ${model}`);
            throw new Error("Validation failed");
          }
        }

        return jsonResponse["modelResponse"];
      } catch (err) {
        // If we have any more models to try, try them first
        if (index < allModels.length - 1) {
          continue;
        } else {
          throw err;
        }
      }
    }
  } catch (e) {
    console.error("Error querying model:", e);
    throw e;
  }
}
