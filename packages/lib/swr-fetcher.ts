// Native fetch implementation - no external dependencies needed

export enum HTTP_METHOD {
  POST = 'POST',
  PATCH = 'PATCH',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export const generateActionFetcher =
  (method: HTTP_METHOD) =>
  async <T>(uri: string, { arg }: { arg: T }) => {
    const r = await fetch(uri, {
      method,
      body: JSON.stringify(arg),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!r.ok) {
      const error = new Error('An error occurred while fetching the data.');
      (error as any).info = await r.json();
      (error as any).status = r.status;
      throw error;
    }

    return r.json();
  };

export const createFetcher =
  (config: RequestInit) =>
  async <T>(url: string, { arg }: { arg: T }) => {
    const response = await fetch(url, {
      ...config,
      body: JSON.stringify(arg),
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    if (!response.ok) {
      const error = new Error('An error occurred while fetching the data.');
      (error as any).info = await response.json();
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  };

export const fetcher = async (url: string, config?: RequestInit) => {
  const response = await fetch(url, config);

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    (error as any).info = await response.json();
    (error as any).status = response.status;
    throw error;
  }

  return response.json();
};
