import assert from 'node:assert/strict';
import { test } from 'vitest';
import { userDatabase } from '../auth/database.server.ts';
import { recipeService } from './service.server.ts';
import { RecipeValidationError } from './validate.ts';
import { example } from '../../../tests/support/recipe-example.ts';

const config = { supabaseUrl: 'https://recipes-test.supabase.co', publishableKey: 'sb_publishable_test' };
const row = { id: '143e33aa-dcb8-489b-b7b4-d7f1fc21ae3f', created_at: '2026-10-31T23:00:00Z' };

test('concurrent recipe services retain each verified caller, JWT, and original document', async () => {
  const writes: Request[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    writes.push(new Request(input, init));
    await Promise.resolve();
    return Response.json(row, { status: 201 });
  };
  const results = await Promise.all(['alice', 'bob'].map(userId => recipeService(
    userDatabase(config, userId + '-jwt', fetcher), userId,
  ).create(example)));
  assert.deepEqual(results, ['alice', 'bob'].map(() => ({
    recipe_id: row.id, created_at: row.created_at, title: example.title,
  })));
  assert.equal(writes.length, 2);
  for (const request of writes) {
    const body = await request.json();
    assert.equal(request.method, 'POST');
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + body.user_id + '-jwt');
    assert.equal(request.headers.get('apikey'), config.publishableKey);
    assert.deepEqual(body.document, example);
    assert.ok(request.signal);
  }
});

test('listing paginates the full collection with stable ordering and only summary fields', async () => {
  const summaries = Array.from({ length: 501 }, (_, index) => ({ recipe_id: row.id, title: `Recipe ${index}`, subtitle: 'A summary' }));
  const reads: Request[] = [];
  const service = recipeService(userDatabase(config, 'owner-jwt', async (input, init) => {
    const request = new Request(input, init);
    reads.push(request);
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get('offset'));
    const limit = Number(url.searchParams.get('limit'));
    const page = summaries.slice(offset, offset + limit);
    return Response.json(page, { headers: { 'Content-Range': `${offset}-${offset + page.length - 1}/${summaries.length}` } });
  }), 'owner');
  assert.deepEqual(await service.list(), summaries);
  assert.equal(reads.length, 2);
  for (const [index, request] of reads.entries()) {
    const url = new URL(request.url);
    assert.equal(request.method, 'GET');
    assert.equal(url.searchParams.get('offset'), String(index * 500));
    assert.equal(url.searchParams.get('limit'), '500');
    assert.equal(url.searchParams.get('order'), 'created_at.desc,id.desc');
    assert.equal(url.searchParams.get('user_id'), 'eq.owner');
    assert.equal(url.searchParams.get('select'), 'recipe_id:id,title:document->>title,subtitle:document->>subtitle');
    assert.equal(request.headers.get('Authorization'), 'Bearer owner-jwt');
  }
});

test('a lower Data API row cap does not truncate the recipe list', async () => {
  const offsets: number[] = [];
  const service = recipeService(userDatabase(config, 'jwt', async (input, init) => {
    const offset = Number(new URL(new Request(input, init).url).searchParams.get('offset'));
    offsets.push(offset);
    const all = [0, 1, 2].map(index => ({ recipe_id: row.id, title: `Recipe ${index}`, subtitle: 'A summary' }));
    const page = all.slice(offset, offset + 2);
    return Response.json(page, { headers: { 'Content-Range': `${offset}-${offset + page.length - 1}/3` } });
  }), 'owner');
  assert.equal((await service.list()).length, 3);
  assert.deepEqual(offsets, [0, 2]);
});

test('concurrent lists preserve each caller JWT and ownership filter', async () => {
  const reads: Request[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    reads.push(request);
    const owner = new URL(request.url).searchParams.get('user_id')!.slice(3);
    return Response.json([{ recipe_id: row.id, title: owner, subtitle: 'A summary', version: 1 }]);
  };
  const results = await Promise.all(['alice', 'bob'].map(owner => recipeService(
    userDatabase(config, owner + '-jwt', fetcher), owner,
  ).list()));
  assert.deepEqual(results, ['alice', 'bob'].map(title => [{ recipe_id: row.id, title, subtitle: 'A summary' }]));
  for (const request of reads) {
    const owner = new URL(request.url).searchParams.get('user_id')!.slice(3);
    assert.equal(request.headers.get('Authorization'), 'Bearer ' + owner + '-jwt');
  }
});

test('a failed or incomplete later page rejects instead of returning a partial collection', async () => {
  for (const secondPage of [new Response('private error', { status: 500 }),
    Response.json([], { headers: { 'Content-Range': '*/3' } })]) {
    let reads = 0;
    const service = recipeService(userDatabase(config, 'jwt', async () => {
      reads++;
      return reads === 1
        ? Response.json([{ recipe_id: row.id, title: 'Recipe', subtitle: 'Summary' }], { headers: { 'Content-Range': '0-0/3' } })
        : secondPage;
    }), 'owner');
    await assert.rejects(service.list());
    assert.equal(reads, 2);
  }
});

test('invalid recipe structure and references fail before touching storage', async () => {
  let writes = 0;
  const service = recipeService(userDatabase(config, 'jwt', async () => {
    writes++;
    return Response.json(row);
  }), 'owner');
  for (const input of [
    { ...example, user_id: 'another-user' },
    { ...example, id: row.id },
    { ...example, components: [{ id: 'main', steps: [{ text: '${i:missing}' }] }] },
  ]) {
    await assert.rejects(service.create(input), RecipeValidationError);
  }
  assert.equal(writes, 0);
});

test('unconfirmed writes and malformed storage responses fail without automatic retries', async () => {
  for (const respond of [
    () => new Response('private database detail', { status: 500 }),
    () => Response.json(null),
    () => Response.json([]),
    () => Response.json([row, row]),
    () => Response.json({ ...row, id: 'not-a-uuid' }),
    () => Response.json({ ...row, created_at: 'not-a-timestamp' }),
    () => { throw new Error('private network detail'); },
  ]) {
    let writes = 0;
    const service = recipeService(userDatabase(config, 'jwt', async () => {
      writes++;
      return respond();
    }), 'owner');
    await assert.rejects(service.create(example));
    assert.equal(writes, 1, 'Do not retry a write whose outcome is uncertain.');
  }
});
