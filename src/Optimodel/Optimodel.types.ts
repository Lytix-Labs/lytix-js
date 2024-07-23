export enum ModelTypes {
  // Meta
  llama_3_8b_instruct = "llama_3_8b_instruct",
  llama_3_70b_instruct = "llama_3_70b_instruct",
  llama_3_1_405b = "llama_3_1_405b",
  llama_3_1_70b = "llama_3_1_70b",
  llama_3_1_8b = "llama_3_1_8b",

  // Anthropic
  claude_3_5_sonnet = "claude_3_5_sonnet",
  claude_3_haiku = "claude_3_haiku",

  // Mistral
  mistral_7b_instruct = "mistral_7b_instruct",
  mixtral_8x7b_instruct = "mixtral_8x7b_instruct",

  // OpenAI Related
  gpt_4 = "gpt_4",
  gpt_3_5_turbo = "gpt_3_5_turbo",
  gpt_4o = "gpt_4o",
  gpt_4_turbo = "gpt_4_turbo",
  gpt_3_5_turbo_0125 = "gpt_3_5_turbo_0125",
  gpt_4o_mini = "gpt_4o_mini",
}

export interface ModelImageMessageSource {
  type: string;
  mediaType: string;
  data: string;
}

export interface ModelMessageContentEntry {
  type: string;
  text?: string | null;
  source?: ModelImageMessageSource | null;
}

export interface ModelMessage {
  role: string;
  content: string | ModelMessageContentEntry[];
}

export enum SpeedPriority {
  low = "low",
  high = "high",
}
