'use server';

import { uploadToS3 } from '../aws';
import { cuid } from '../ids';

/**
 * Uploads an image for an article to S3
 * @param formData FormData containing the file and articleId
 * @returns The public URL of the uploaded image
 */
export async function uploadArticleImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  const articleId = formData.get('articleId') as string;

  if (!file) {
    throw new Error('No file provided');
  }

  if (!articleId) {
    throw new Error('No article ID provided');
  }

  // Convert file to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get content type and extension
  const contentType = file.type || 'image/png';
  const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';

  // Generate S3 key path
  const filename = cuid();
  const s3Key = `lovarank/articles/${articleId}/${filename}.${extension}`;

  // Upload to S3
  const publicUrl = await uploadToS3(buffer, contentType, s3Key);

  return publicUrl;
}
