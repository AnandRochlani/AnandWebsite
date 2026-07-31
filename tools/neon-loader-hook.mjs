// The actual resolution hook (runs in a worker, not the main thread).
let shimUrl = null;

export async function initialize(data) {
  shimUrl = data?.shimUrl || null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@neondatabase/serverless' && shimUrl) {
    return { url: shimUrl, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
