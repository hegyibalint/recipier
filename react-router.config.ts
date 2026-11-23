import type { Config } from '@react-router/dev/config';

export default {
  appDirectory: 'app',
  buildDirectory: '.cache/build',
  ssr: true,
  // Keep browser-auth HydrateFallback exports in the initial route modules.
  splitRouteModules: false,
} satisfies Config;
