<script>
	import '../app.css';
	// Import Font Awesome CSS
	import '@fortawesome/fontawesome-free/css/all.min.css';

	let { children } = $props();
</script>

<div
	class="min-h-screen bg-[var(--color-defense-dark)] bg-gradient-to-br from-[var(--color-defense-dark)] to-[var(--color-hero-navy)]"
>
	{@render children()}
</div>
