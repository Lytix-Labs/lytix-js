import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 } from "uuid";
import metricCollector from "../MetricCollector";

/**
 * Upload a file to Azure and capture the URL in Lytix
 * @returns The ID of the video in Lytix that can then be used in the ModelIOEvent
 */
export const UploadFileToAzureAndLytix = async (args: {
  filePath: string;
  mimeType: string;
  storageAccountName: string;
  containerName?: string;
}) => {
  const {
    filePath,
    mimeType,
    storageAccountName,
    containerName = "lytix-gemini-videos",
  } = args;

  try {
    const baseURL = `https://${storageAccountName}.blob.core.windows.net`;
    const defaultAzureCredential = new DefaultAzureCredential();
    const blobServiceClient = new BlobServiceClient(
      baseURL,
      defaultAzureCredential
    );

    /**
     * First get a reference to the container
     */
    const containerClient = blobServiceClient.getContainerClient(containerName);

    /**
     * Now lets always make sure the container exists, otherwise create it
     */
    await containerClient.createIfNotExists();

    /**
     * Create a blob name for this file
     */
    const uniqueFileId = v4();
    const blobName = `${uniqueFileId}-${filePath.split("/").pop()}`;

    /**
     * Upload the file to Azure
     */
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(filePath);

    /**
     * Noq lets save our blob URL in lytix
     */
    const blobURL = `${baseURL}/${containerName}/${blobName}`;
    const id = await metricCollector.captureAzureVideoURL({
      videoURL: blobURL,
      mimeType,
    });

    if (!id) {
      throw new Error("Failed to capture Azure Video URL in Lytix");
    }

    return id;
  } catch (err) {
    console.error(
      `Failed to upload file to Azure and capture URL in Lytix: ${err}`
    );
    return "";
  }
};
