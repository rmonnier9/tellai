import { S3 } from 'aws-sdk';

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

export default getS3RootDomain;
