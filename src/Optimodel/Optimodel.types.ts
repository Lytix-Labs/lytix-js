export enum ModelTypes {
  // # Meta
  llama_3_8b_instruct = "llama_3_8b_instruct",
  llama_3_70b_instruct = "llama_3_70b_instruct",
  llama_3_1_405b = "llama_3_1_405b",
  llama_3_1_70b = "llama_3_1_70b",
  llama_3_1_8b = "llama_3_1_8b",
  llama_3_1_405b_instruct = "llama_3_1_405b_instruct",
  llama_3_1_70b_instruct = "llama_3_1_70b_instruct",
  llama_3_1_8b_instruct = "llama_3_1_8b_instruct",

  // # Anthropic
  claude_3_5_sonnet_20240620 = "claude_3_5_sonnet_20240620",
  claude_3_5_sonnet = "claude_3_5_sonnet",
  claude_3_haiku = "claude_3_haiku",
  claude_3_sonnet = "claude_3_sonnet",

  // # Mistral
  mistral_7b_instruct = "mistral_7b_instruct",
  mixtral_8x7b_instruct = "mixtral_8x7b_instruct",
  codestral_latest = "codestral_latest",
  mistral_large_latest = "mistral_large_latest",
  open_mistral_nemo = "open_mistral_nemo",

  // # OpenAI Related
  gpt_4 = "gpt_4",
  gpt_3_5_turbo = "gpt_3_5_turbo",
  gpt_4o = "gpt_4o",
  gpt_4_turbo = "gpt_4_turbo",
  gpt_3_5_turbo_0125 = "gpt_3_5_turbo_0125",
  gpt_4o_mini = "gpt_4o_mini",
  gpt_4o_mini_2024_07_18 = "gpt_4o_mini_2024_07_18",
  gpt_4o_2024_08_06 = "gpt_4o_2024_08_06",
  o1_preview = "o1_preview",
  o1_preview_2024_09_12 = "o1_preview_2024_09_12",
  o1_mini = "o1_mini",
  o1_mini_2024_09_12 = "o1_mini_2024_09_12",
}

export enum Providers {
  openai = "openai",
  togetherai = "togetherai",
  groq = "groq",
  anthropic = "anthropic",
  bedrock = "bedrock",
  mistralai = "mistralai",
  mistralcodestral = "mistralcodestral",
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

export interface LLamaPromptGuardConfig {
  guardName: "META_LLAMA_PROMPT_GUARD_86M";
  jailbreakThreshold: number | null;
  injectionThreshold: number | null;
}

export interface LytixRegexConfig {
  guardName: "LYTIX_REGEX_GUARD";
  regex: string;
}

export interface MicrosoftPresidioConfig {
  guardName: "MICROSOFT_PRESIDIO_GUARD";
  entitiesToCheck: string[];
}

export type Guards =
  | LLamaPromptGuardConfig
  | LytixRegexConfig
  | MicrosoftPresidioConfig;

export interface QueryResponse {
  modelResponse: string;
  promptTokens: number;
  generationTokens: number;
  cost: number;
  provider: Providers;
  guardErrors: string[];
}

export interface TogetherAICredentials {
  togetherApiKey: string;
}

export interface AnthropicCredentials {
  anthropicApiKey: string;
}

export interface GroqCredentials {
  groqApiKey: string;
}

export interface OpenAICredentials {
  openAiKey: string;
}

export interface AWSBedrockCredentials {
  awsAccessKeyId: string;
  awsSecretKey: string;
  awsRegion: string;
}

export interface MistralAICredentials {
  mistralAiKey: string;
}

export interface MistralCodeStralCredentials {
  mistralCodeStralApiKey: string;
}

export interface GeminiCredentials {
  geminiApiKey: string;
}

export type Credentials =
  | TogetherAICredentials
  | OpenAICredentials
  | AWSBedrockCredentials
  | GroqCredentials
  | AnthropicCredentials
  | MistralAICredentials
  | MistralCodeStralCredentials
  | GeminiCredentials;

interface GuardQueryBase {
  guardName: string;
}
