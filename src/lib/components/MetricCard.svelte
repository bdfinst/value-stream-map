<script>
  export let title = "";
  export let value = "";
  export let isException = false;
</script>

<div
  class={`rounded-md border p-4 text-center ${
    isException 
      ? 'border-[var(--color-action-red)] bg-[var(--color-unicorn-white)]' 
      : 'border-[var(--color-light-gray)] bg-[var(--color-background-white)]'
  }`}
>
  <h3 class="text-sm font-medium text-[var(--color-mission-blue)]">{title}</h3>
  <p class={`mt-2 text-2xl font-bold ${
    isException 
      ? 'text-[var(--color-action-red)]' 
      : 'text-[var(--color-defense-dark)]'
  }`}>
    {value}
  </p>
</div>