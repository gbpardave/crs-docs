// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'CRS Docs',
			description:
				'Documentación del ecosistema CRS (Courier & Logistics Management)',
			sidebar: [
				{
					label: 'crs-backend',
					items: [
						{ label: 'Autenticación y autorización', slug: 'backend/auth' },
					],
				},
				// Próximas secciones del ecosistema:
				// { label: 'crs-delivery', autogenerate: { directory: 'delivery' } },
				// { label: 'crs-go', autogenerate: { directory: 'go' } },
			],
		}),
	],
});
