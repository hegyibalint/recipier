import * as trpcNext from '@trpc/server/adapters/sv';
import { appRouter } from '$lib/../server/_app';

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({})
});
