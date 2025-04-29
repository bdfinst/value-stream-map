import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import globals from 'globals';

export default [
	js.configs.recommended,
	eslintConfigPrettier,
	...eslintPluginSvelte.configs['flat/prettier'],

	{
		ignores: [
			'build/**',
			'node_modules/**',
			'coverage/**',
			'.svelte-kit/**',
			'package/*',
			'.env',
			'.env.*',
			'pnpm-lock.yaml',
			'package-lock.json',
			'yarn.lock',
			'html/**',
			'tests/**/*.test.js',
			'storybook-static/**',
			'.netlify/**'
		]
	},

	{
		files: ['**/*.js', '**/*.svelte'],

		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser
			}
		},

		rules: {
			'svelte/no-at-html-tags': 'off',
			'svelte/no-target-blank': ['error'],
			'prefer-template': 'error',
			'tailwindcss/no-custom-classname': [0]
		}
	}
];
