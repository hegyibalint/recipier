<script lang="ts">
  export let direction: 'LEFT' | 'RIGHT' | undefined;

  export let onPage: () => void | undefined;
  // export let onHome: () => void | undefined;
</script>

<button on:click={onPage}>{direction}</button>
