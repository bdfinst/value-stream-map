import adapter from '@sveltejs/adapter-netlify';

const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$routes: 'src/routes'
		}
	}
};

export default config;
