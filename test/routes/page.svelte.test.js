import '@testing-library/jest-dom/vitest';

import Page from '$routes/+page.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';

describe('/+page.svelte', () => {
	test('should render h1', () => {
		render(Page);
		expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
	});
});
