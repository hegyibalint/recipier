import { renderToReadableStream } from 'react-dom/server';
import { ServerRouter, type EntryContext, type RouterContextProvider } from 'react-router';
import { nonceContext } from './lib/request-context';

export default async function handleRequest(
  request: Request,
  status: number,
  headers: Headers,
  context: EntryContext,
  loadContext: RouterContextProvider,
) {
  const nonce = loadContext.get(nonceContext);
  const body = await renderToReadableStream(
    <ServerRouter context={context} url={request.url} nonce={nonce} />,
    {
      nonce,
      signal: request.signal,
      onError(error) {
        status = 500;
        console.error(error);
      },
    },
  );
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(body, { status, headers });
}
