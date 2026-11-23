import { createContext } from 'react-router';

// Populated by the Worker for each request, then consumed by the SSR entry point.
export const nonceContext = createContext<string>();
