import replicate from './replicate';
import { moveRemoteAssetToS3 } from './aws';

export async function generateImage({
  prompt,
  aspect_ratio,
  s3Path,
}: {
  prompt: string;
  aspect_ratio?: string;
  s3Path?: string;
}) {
  const res = await replicate.predictions.create({
    wait: true,
    model: 'google/nano-banana',
    input: {
      prompt,
      aspect_ratio,
    },
  });

  const replicateUrl = res.output as string; // image url from replicate

  // If s3Path is provided, download and upload to S3
  if (s3Path) {
    try {
      const s3Url = await moveRemoteAssetToS3(replicateUrl, s3Path);
      return s3Url;
    } catch (error) {
      console.error('Failed to upload image to S3:', error);
      // Fallback to replicate URL if S3 upload fails
      return replicateUrl;
    }
  }

  // If no s3Path provided, return the replicate URL directly
  return replicateUrl;
}
