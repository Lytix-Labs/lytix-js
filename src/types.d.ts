/**
 * Workaround so that we dont have to install all dependencies for traceloop SDK
 */
declare module "@anthropic-ai/sdk";
declare module "@azure/openai";
declare module "cohere-ai";
declare module "@aws-sdk/client-bedrock-runtime";
declare module "@google-cloud/aiplatform";
declare module "@pinecone-database/pinecone";
declare module "langchain/chains";
declare module "langchain/agents";
declare module "langchain/tools";
declare module "@langchain/core/runnables";
declare module "@langchain/core/vectorstores";
declare module "llamaindex";
declare module "chromadb";
declare module "@qdrant/js-client-rest";
