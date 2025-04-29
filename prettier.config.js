export default {
	bracketSpacing: true,
	htmlWhitespaceSensitivity: 'ignore',
	overrides: [
		{
			files: '*.svelte',
			options: {
				parser: 'svelte'
			}
		}
	],
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss', 'prettier-plugin-sort-json'],
	printWidth: 100,
	semi: false,
	singleQuote: true,
	tabWidth: 2,
	trailingComma: 'none',
	useTabs: true
};
