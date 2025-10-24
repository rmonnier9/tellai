export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ArticleData {
  title: string;
  content: string;
  slug: string;
  metaDescription: string;
  keyword: string;
  imageUrl: string;
  createdAt: string;
}

export interface CredentialConfig {
  type: string;
  accessToken?: string | null;
  config: any;
}

export abstract class BasePublisher {
  abstract publish(
    article: ArticleData,
    credential: CredentialConfig
  ): Promise<PublishResult>;
}
