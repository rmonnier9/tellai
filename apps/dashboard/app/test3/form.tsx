'use client';

import { useState } from 'react';
import { generateKeywordIdeas } from './action';

export function Form() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setResult(null);
    try {
      const res = await generateKeywordIdeas(formData);
      setResult(res);
    } catch (error) {
      setResult(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <form action={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '15px' }}>
          <h3>Option 1: Use Existing Product</h3>
          <input
            name="productId"
            type="text"
            placeholder="Enter Product ID"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>Option 2: Test with Manual Data</h3>
          <input
            name="name"
            type="text"
            placeholder="Product Name (e.g., TaskFlow)"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <textarea
            name="description"
            placeholder="Product Description (e.g., A project management tool for remote teams)"
            rows={3}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <input
            name="url"
            type="url"
            placeholder="Website URL (e.g., https://example.com)"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <input
            name="country"
            type="text"
            placeholder="Country Code (e.g., US, GB, FR)"
            defaultValue="US"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <input
            name="language"
            type="text"
            placeholder="Language Code (e.g., en, fr, es)"
            defaultValue="en"
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <textarea
            name="targetAudiences"
            placeholder="Target Audiences (comma-separated, e.g., Remote workers, Project managers, Startups)"
            rows={2}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
          }}
        >
          {loading ? 'Generating Ideas...' : 'Generate Keyword Ideas'}
        </button>
      </form>

      {loading && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f0f0f0',
            borderRadius: '5px',
          }}
        >
          <p>⏳ Generating keyword ideas... This may take 30-60 seconds.</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            The workflow is:
            <br />
            1. Generating seed keywords...
            <br />
            2. Fetching keyword data from DataForSEO...
            <br />
            3. Categorizing keywords with AI...
            <br />
            4. Creating 30-day content calendar...
          </p>
        </div>
      )}

      {result && (
        <div>
          <h3>Results:</h3>
          <pre
            style={{
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              overflow: 'auto',
              maxHeight: '600px',
              fontSize: '12px',
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
