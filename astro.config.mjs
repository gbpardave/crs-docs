// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from '@beoe/rehype-mermaid';

// Caché en memoria: deduplica diagramas idénticos dentro de un mismo build.
// El render real lo hace Chromium en la etapa de build del Docker (ver Dockerfile).
const cache = new Map();

// https://astro.build/config
export default defineConfig({
	// Dominio de publicación: habilita URLs canónicas y sitemap correctos (SEO).
	site: 'https://docs.crs-logistics.com',
	markdown: {
		// Convierte los bloques ```mermaid en SVG embebido (strategy 'inline':
		// 0 JS al navegador). darkScheme 'class' se integra con el tema de Starlight.
		rehypePlugins: [
			[rehypeMermaid, { strategy: 'inline', darkScheme: 'class', cache }],
		],
	},
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
