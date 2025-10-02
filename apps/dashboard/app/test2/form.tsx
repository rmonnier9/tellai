'use client';

import { useState } from 'react';
import { getBusinessData } from './action';

export function Form() {
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    const res = await getBusinessData(formData);
    // setResult(JSON.stringify(res, null, 2));
    setResult(res);
  }

  return (
    <>
      <form action={handleSubmit}>
        <input name="url" type="url" placeholder="Enter Website URL" required />
        <button type="submit">Analyze Website</button>
      </form>
      {result && <pre>{result}</pre>}
    </>
  );
}
