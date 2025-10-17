import { S3 } from 'aws-sdk';
import axios from 'axios';
import { cuid } from './ids';

export const s3 = new S3({
  signatureVersion: 'v4',
  accessKeyId: process.env.APP_AWS_ACCESS_KEY,
  secretAccessKey: process.env.APP_AWS_SECRET_KEY,
  region: process.env.APP_AWS_REGION,
  ...(process.env.APP_AWS_S3_ENDPOINT
    ? {
        endpoint: process.env.APP_AWS_S3_ENDPOINT,
        s3ForcePathStyle: process.env.APP_AWS_S3_FORCE_PATH_STYLE === 'true',
      }
    : {}),
});

export async function deleteFolderFromS3Bucket(
  bucketName: string,
  prefix: string
) {
  const listParams = {
    Bucket: bucketName,
    Prefix: prefix,
  };

  const listedObjects = await s3.listObjectsV2(listParams).promise();

  if (listedObjects?.Contents?.length === 0) return;

  const deleteParams = {
    Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
    Delete: { Objects: [] as any },
  };

  listedObjects?.Contents?.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key });
  });

  return s3.deleteObjects(deleteParams).promise();
}

export const generateProjectS3KeyPrefix = (props: { projectId: string }) =>
  `projects/${props.projectId}`;

const getS3RootDomain = () => {
  if (process.env.NEXT_PUBLIC_AWS_ENDPOINT) {
    return `${process.env.NEXT_PUBLIC_AWS_ENDPOINT}`;
  }
  return `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.amazonaws.com`;
};

export const getS3PublicUrl = ({ key }: { key: string }) => {
  return `${getS3RootDomain()}/${key}`;
};

/**
 * Generic function to upload a file buffer to S3
 * @param buffer - The file buffer to upload
 * @param contentType - The MIME type of the file
 * @param s3Key - The full S3 key path (e.g., 'articles/123/image.png')
 * @returns The public URL of the uploaded file
 */
export async function uploadToS3(
  buffer: Buffer,
  contentType: string,
  s3Key: string
): Promise<string> {
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3 bucket name is not configured');
  }

  await s3
    .putObject({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000',
    })
    .promise();

  return getS3PublicUrl({ key: s3Key });
}

/**
 * Downloads a remote asset and uploads it to S3
 * @param remoteUrl - The URL of the remote asset to download
 * @param s3Path - The S3 directory path (e.g., 'articles/123' or 'uploads')
 * @param options - Optional configuration
 * @param options.timeout - Download timeout in milliseconds (default: 30000)
 * @returns The public S3 URL of the uploaded file
 */
export async function moveRemoteAssetToS3(
  remoteUrl: string,
  s3Path: string,
  options?: {
    timeout?: number;
  }
): Promise<string> {
  const timeout = options?.timeout || 30000;

  // Download the asset from the remote URL
  const response = await axios.get(remoteUrl, {
    responseType: 'arraybuffer',
    timeout,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const contentType = response.headers['content-type'] || 'image/png';
  const buffer = Buffer.from(response.data, 'binary');

  // Extract extension from content type
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

  // Generate unique filename and full S3 key
  const filename = cuid();
  const s3Key = `${s3Path}/${filename}.${extension}`;

  // Upload to S3 and return the public URL
  return uploadToS3(buffer, contentType, s3Key);
}

export default getS3RootDomain;
