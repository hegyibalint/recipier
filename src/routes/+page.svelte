<script lang="ts">
  import MealCalendar from '$lib/components/MealCalendar.svelte';

  let weekText: string;
</script>

<div class="flex-grow text-center">
  <h1 class="py-2">
    ~ Meals {#if weekText} &ndash; {weekText}{/if} ~
  </h1>
  <MealCalendar bind:weekText />
</div>
