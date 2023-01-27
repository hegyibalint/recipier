<script lang="ts">
  import type { Meal, Mealtime, Recipe } from '@prisma/client';
  import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
  import { endOfWeek, startOfWeek } from 'date-fns';
  import { onMount } from 'svelte';
  import { trpc } from '../../server/client';
  import type { AppRouter } from '../../server/_app';

  type RouterInput = inferRouterInputs<AppRouter>;
  type RouterOutput = inferRouterOutputs<AppRouter>;

  export let date: Date = new Date();
  export let mealtimes: Mealtime[];

  let meals: RouterOutput['meals']['query'];
  onMount(async () => {
    meals = await trpc.meals.query({
      from: startOfWeek(date),
      to: endOfWeek(date)
    });
  });
</script>

<div class="flex flex-row">
  <div class="grid" />
</div>
