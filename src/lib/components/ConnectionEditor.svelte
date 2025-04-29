<script>
  import { validateConnection } from '../valueStream/connectionEditor.js';
  
  /** @type {import('../valueStream/connection').Connection} */
  export let connection;
  /** @type {Array} - List of all processes for selection */
  export let processes = [];
  /** @type {Function} */
  export let onSave;
  /** @type {Function} */
  export let onCancel;
  
  // Create local copies of connection data for editing
  let sourceId = connection.sourceId;
  let targetId = connection.targetId;
  let waitTime = connection.metrics?.waitTime || 0;
  
  // Form validation
  let errors = {};
  
  function validateForm() {
    const connectionData = {
      sourceId,
      targetId,
      metrics: { waitTime }
    };
    
    // Convert waitTime to number
    waitTime = Number(waitTime);
    if (isNaN(waitTime) || waitTime < 0) {
      errors = { ...errors, 'metrics.waitTime': 'Wait time must be a positive number' };
      return false;
    }
    
    const result = validateConnection(connectionData);
    errors = result.errors;
    
    return result.isValid;
  }
  
  function handleSubmit() {
    if (!validateForm()) return;
    
    // Create updated connection object
    const updatedConnection = {
      ...connection,
      sourceId,
      targetId,
      metrics: {
        ...(connection.metrics || {}),
        waitTime: Number(waitTime)
      }
    };
    
    onSave(updatedConnection);
  }
</script>

<div class="p-4 bg-white rounded-lg shadow">
  <h2 class="text-xl font-bold mb-4">Edit Connection</h2>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
    <div>
      <label for="source-process" class="block text-sm font-medium text-gray-700 mb-1">Source Process</label>
      <select 
        id="source-process"
        bind:value={sourceId}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a source process</option>
        {#each processes as process}
          <option value={process.id}>{process.name}</option>
        {/each}
      </select>
      {#if errors.sourceId}
        <p class="mt-1 text-sm text-red-600">{errors.sourceId}</p>
      {/if}
    </div>
    
    <div>
      <label for="target-process" class="block text-sm font-medium text-gray-700 mb-1">Target Process</label>
      <select 
        id="target-process"
        bind:value={targetId}
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">Select a target process</option>
        {#each processes as process}
          {#if process.id !== sourceId}
            <option value={process.id}>{process.name}</option>
          {/if}
        {/each}
      </select>
      {#if errors.targetId}
        <p class="mt-1 text-sm text-red-600">{errors.targetId}</p>
      {/if}
    </div>
    
    <div>
      <label for="wait-time" class="block text-sm font-medium text-gray-700 mb-1">Wait Time</label>
      <input 
        type="number"
        id="wait-time"
        bind:value={waitTime}
        min="0"
        class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
      {#if errors['metrics.waitTime']}
        <p class="mt-1 text-sm text-red-600">{errors['metrics.waitTime']}</p>
      {/if}
    </div>
    
    <div class="flex justify-end space-x-2">
      <button
        type="button"
        on:click={onCancel}
        aria-label="Cancel connection editing"
        class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Cancel
      </button>
      <button
        type="submit"
        aria-label="Save connection changes"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Save
      </button>
    </div>
  </form>
</div>