<script lang="ts">
  import MealCalendar from '$lib/components/MealCalendar.svelte';
  import type { Mealtime } from '@prisma/client';
  import Pager from '$lib/components/Pager.svelte';
  import { addWeeks, differenceInWeeks, startOfWeek, subWeeks } from 'date-fns';

  let date = startOfWeek(new Date());

  function formatDistance(weekDifference: number) {
    if (weekDifference == 0) return 'This week';
    else if (weekDifference == -1) return 'Previous week';
    else if (weekDifference == +1) return 'Next week';
    else if (weekDifference < -1) return `${Math.abs(weekDifference)} weeks before`;
    else return `${weekDifference} weeks ahead`;
  }

  function pageLeft() {
    date = subWeeks(date, 1);
    console.log(date);
  }

  function pageRight() {
    date = addWeeks(date, 1);
    console.log(date);
  }

  export let data: {
    mealtimes: Mealtime[];
  };

  let weekText = '';
  $: weekText = formatDistance(differenceInWeeks(date, new Date()));
</script>

<div class="flex-grow text-center">
  <h1 class="py-2">
    ~ Meals {#if weekText} &ndash; {weekText}{/if} ~
  </h1>

  <div class="flex">
    <Pager direction="LEFT" onPage={pageLeft} />
    <MealCalendar />
    <Pager direction="RIGHT" onPage={pageRight} />
  </div>
</div>
