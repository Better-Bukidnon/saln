import { loadEnv } from 'vite'

// A production build must never contain the demo sample official. VITE_DEMO_DATA is only honoured in
// `vite --mode demo` (npm run dev:demo); any other build with it set in the environment fails loudly.
export function assertNoDemoInBuild(command: string, mode: string, env: Record<string, string | undefined>): void {
  if (command === 'build' && mode !== 'demo' && env.VITE_DEMO_DATA) {
    throw new Error('VITE_DEMO_DATA is set: refusing to build with the demo sample official. Unset it for a real build.')
  }
  if (command === 'build' && mode === 'demo') {
    throw new Error('Building with --mode demo is not allowed: demo data is for the dev server only.')
  }
}

/** The effective VITE_DEMO_DATA for a build: the process env plus .env, .env.local, .env.[mode] and .env.[mode].local. */
export function demoEnvFor(
  mode: string,
  dir: string,
  processEnv: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const fromFiles = loadEnv(mode, dir, 'VITE_')
  return { VITE_DEMO_DATA: processEnv.VITE_DEMO_DATA || fromFiles.VITE_DEMO_DATA }
}
