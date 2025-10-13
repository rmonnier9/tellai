import replicate from './replicate';

export async function generateImage({
  prompt,
  aspect_ratio,
}: {
  prompt: string;
  aspect_ratio?: string;
}) {
  const res = await replicate.predictions.create({
    wait: true,
    model: 'google/nano-banana',
    input: {
      prompt,
      aspect_ratio,
    },
  });

  return res.output as string; // image url
}
