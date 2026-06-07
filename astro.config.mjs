// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
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
		// API de Astro 6+ (la antigua `markdown.rehypePlugins` se elimina en Astro 8).
		processor: unified({
			rehypePlugins: [
				[
					rehypeMermaid,
					{
						strategy: 'inline',
						darkScheme: 'class',
						cache,
						// Tema de marca: nodos/actores en coral con texto blanco. Estos
						// colores se leen bien sobre fondo claro y oscuro, así que la
						// variante clara (theme 'default') y la oscura (el plugin fuerza
						// theme 'dark') quedan coherentes con la marca CRS.
						mermaidConfig: {
							theme: 'base',
							themeVariables: {
								primaryColor: '#e04c5c',
								primaryTextColor: '#ffffff',
								primaryBorderColor: '#c23443',
								lineColor: '#e04c5c',
							},
						},
					},
				],
			],
		}),
	},
	integrations: [
		starlight({
			title: 'CRS Docs',
			description:
				'Documentación del ecosistema CRS (Courier & Logistics Management)',
			// Logo de marca en lugar del texto del título. `replacesTitle` oculta el
			// texto "CRS Docs" (que sigue usándose como alt y para SEO/pestaña).
			// light = tema claro (logo con texto navy); dark = tema oscuro (texto blanco).
			logo: {
				light: './src/assets/crs-logo-light.png',
				dark: './src/assets/crs-logo-dark.png',
				replacesTitle: true,
			},
			// Tema de marca CRS (debe ir primero) + conmutador de diagramas Mermaid.
			customCss: ['./src/styles/theme.css', './src/styles/mermaid.css'],
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
