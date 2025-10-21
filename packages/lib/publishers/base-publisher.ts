export interface PublishResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ArticleData {
  title: string;
  metaDescription?: string;
  content: string;
  keyword: string;
  imageUrl?: string | null;
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
