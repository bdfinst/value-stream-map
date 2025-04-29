<script>
  export let show = false;
  export let title = '';
  export let onClose = () => {};
  
  function handleEscape(event) {
    if (event.key === 'Escape' && show) {
      onClose();
    }
  }

  function handleBackdropClick(event) {
    // Only close if clicking the backdrop, not the modal content
    if (event.target === event.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleEscape} />

{#if show}
  <div 
    class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50"
    on:click={handleBackdropClick}
  >
    <div 
      class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div class="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
        <h3 id="modal-title" class="text-lg font-medium text-gray-900">{title}</h3>
        <button 
          type="button" 
          class="text-gray-400 hover:text-gray-500 focus:outline-none"
          aria-label="Close"
          on:click={onClose}
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-4">
        <slot></slot>
      </div>
    </div>
  </div>
{/if}