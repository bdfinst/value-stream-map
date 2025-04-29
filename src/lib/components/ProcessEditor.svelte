<script>
  /** @type {import('../valueStream/processBlock').ProcessBlock} */
  export let process;
  /** @type {Function} */
  export let onSave;
  /** @type {Function} */
  export let onCancel;
  
  // Create local copies of process data for editing
  let name = process.name;
  let description = process.description || '';
  let processTime = process.metrics?.processTime || 0;
  let completeAccurate = process.metrics?.completeAccurate || 100;
  
  // Form validation
  let errors = {
    name: '',
    processTime: '',
    completeAccurate: ''
  };
  
  function validateForm() {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else {
      errors.name = '';
    }
    
    // Validate process time
    if (isNaN(processTime) || processTime < 0) {
      errors.processTime = 'Must be a non-negative number';
      isValid = false;
    } else {
      errors.processTime = '';
    }
    
    // Validate complete and accurate percentage
    if (isNaN(completeAccurate) || completeAccurate < 0 || completeAccurate > 100) {
      errors.completeAccurate = 'Must be a percentage (0-100)';
      isValid = false;
    } else {
      errors.completeAccurate = '';
    }
    
    return isValid;
  }
  
  function handleSubmit() {
    if (!validateForm()) return;
    
    // Create updated process object
    const updatedProcess = {
      ...process,
      name,
      description,
      metrics: {
        ...process.metrics,
        processTime: Number(processTime),
        completeAccurate: Number(completeAccurate)
      }
    };
    
    onSave(updatedProcess);
  }
</script>

<div class="p-4 bg-white rounded-lg shadow">
  <h2 class="text-xl font-bold mb-4">Edit Process</h2>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="process-name" class="block text-sm font-medium text-[var(--color-defense-dark)] mb-1">Name</label>
      <input
        id="process-name"
        type="text"
        bind:value={name}
        class="w-full px-3 py-2 border border-[var(--color-light-gray)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-mission-blue)] focus:border-[var(--color-mission-blue)]"
      />
      {#if errors.name}
        <p class="mt-1 text-sm text-red-600">{errors.name}</p>
      {/if}
    </div>
    
    <div>
      <label for="process-description" class="block text-sm font-medium text-[var(--color-defense-dark)] mb-1">Description</label>
      <textarea
        id="process-description"
        bind:value={description}
        rows="2"
        class="w-full px-3 py-2 border border-[var(--color-light-gray)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-mission-blue)] focus:border-[var(--color-mission-blue)]"
      ></textarea>
    </div>
    
    <div>
      <label for="process-time" class="block text-sm font-medium text-[var(--color-defense-dark)] mb-1">Process Time</label>
      <input
        id="process-time"
        type="number"
        bind:value={processTime}
        min="0"
        step="0.1"
        class="w-full px-3 py-2 border border-[var(--color-light-gray)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-mission-blue)] focus:border-[var(--color-mission-blue)]"
      />
      {#if errors.processTime}
        <p class="mt-1 text-sm text-red-600">{errors.processTime}</p>
      {/if}
    </div>
    
    
    <div>
      <label for="complete-accurate" class="block text-sm font-medium text-[var(--color-defense-dark)] mb-1">Complete & Accurate (%)</label>
      <input
        id="complete-accurate"
        type="number"
        bind:value={completeAccurate}
        min="0"
        max="100"
        step="1"
        class="w-full px-3 py-2 border border-[var(--color-light-gray)] rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-mission-blue)] focus:border-[var(--color-mission-blue)]"
      />
      <p class="mt-1 text-xs text-gray-500">Percentage of output that doesn't require rework</p>
      {#if errors.completeAccurate}
        <p class="mt-1 text-sm text-red-600">{errors.completeAccurate}</p>
      {/if}
    </div>
    
    <div class="flex justify-end space-x-2">
      <button
        type="button"
        on:click={onCancel}
        aria-label="Cancel process editing"
        class="px-4 py-2 border border-[var(--color-light-gray)] rounded-md shadow-sm text-sm font-medium text-[var(--color-defense-dark)] bg-[var(--color-unicorn-white)] hover:bg-[var(--color-background-white)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-mission-blue)]"
      >
        Cancel
      </button>
      <button
        type="submit"
        aria-label="Save process changes"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[var(--color-unicorn-white)] bg-[var(--color-mission-blue)] hover:bg-[var(--color-mission-blue-65)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-mission-blue)]"
      >
        Save
      </button>
    </div>
  </form>
</div>