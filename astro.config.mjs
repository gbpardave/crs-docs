// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	// Dominio de publicación: habilita URLs canónicas y sitemap correctos (SEO).
	site: 'https://docs.crs-logistics.com',
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
				{
					label: 'crs-delivery',
					items: [{ label: 'Visión general', slug: 'delivery' }],
				},
				{
					label: 'crs-go',
					items: [{ label: 'Visión general', slug: 'go' }],
				},
				{
					label: 'Panel & App',
					items: [{ label: 'Visión general', slug: 'panel' }],
				},
			],
		}),
	],
});
