import type { PageServerLoad } from '../../.svelte-kit/types/src/routes/$types';
import { createContext } from '../server/context';
import { appRouter } from '../server/_app';

export const load: PageServerLoad = async (event) => {
  const mealtimes = await appRouter.createCaller(createContext()).mealtimes.list();

  return {
    mealtimes: mealtimes
  };
};
