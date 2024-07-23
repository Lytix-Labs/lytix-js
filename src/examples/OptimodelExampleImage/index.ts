import { ModelTypes, SpeedPriority } from "../../Optimodel/Optimodel.types";
import { queryModel } from "../../Optimodel/QueryModel";

import * as fs from "fs";
import * as path from "path";

const currentFilePath = path.dirname(__filename);
const imagePath = path.join(currentFilePath, "image-test.png");

const imageFile = fs.readFileSync(imagePath);
let encodedString = btoa(imageFile.toString("binary"));
encodedString = Buffer.from(encodedString, "binary").toString("utf-8");

const main = async () => {
  const prompt = "What is the image?";
  const response = await queryModel({
    model: ModelTypes.gpt_4o,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "image",
            source: {
              type: "base64",
              data: encodedString,
              mediaType: "image/png",
            },
          },
        ],
      },
      { role: "system", content: "Always respond with a JSON object" },
    ],
    speedPriority: SpeedPriority.low,
    temperature: 0.5,
    maxGenLen: 256,
  });
  console.log(`Got response: ${response}`);
};

main();
