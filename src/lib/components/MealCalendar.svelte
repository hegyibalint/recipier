<script lang="ts">
  import { differenceInWeeks } from 'date-fns';

  let date: Date = new Date();

  export let weekText: string = formatDistance(differenceInWeeks(date, new Date()));
  $: weekText = formatDistance(differenceInWeeks(date, new Date()));

  function formatDistance(weekDifference: number) {
    if (weekDifference == 0) return 'This week';
    else if (weekDifference == -1) return 'Previous week';
    else if (weekDifference == +1) return 'Next week';
    else if (weekDifference < -1) return `${Math.abs(weekDifference)} weeks before`;
    else return `${weekDifference} weeks ahead`;
  }
</script>

<div class="flex flex-row">
  <div class="grid" />
</div>
