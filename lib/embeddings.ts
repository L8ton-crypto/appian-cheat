// Browser-side embedding for semantic search
let pipeline: unknown = null;
let loadPromise: Promise<unknown> | null = null;
let isLoading = false;

export function modelLoading() {
  return isLoading;
}

export async function getEmbedding(text: string): Promise<number[]> {
  if (!pipeline) {
    if (!loadPromise) {
      isLoading = true;
      loadPromise = (async () => {
        const { pipeline: createPipeline } = await import("@xenova/transformers");
        pipeline = await createPipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
          quantized: true,
        });
        isLoading = false;
        return pipeline;
      })();
    }
    pipeline = await loadPromise;
  }

  const pipe = pipeline as (text: string, opts: Record<string, unknown>) => Promise<{ data: Float32Array }>;
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
