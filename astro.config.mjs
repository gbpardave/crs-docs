// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import rehypeMermaid from '@beoe/rehype-mermaid';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

// Caché en memoria: deduplica diagramas idénticos dentro de un mismo build.
// El render real lo hace Chromium en la etapa de build del Docker (ver Dockerfile).
const cache = new Map();

// Referencia de API de crs-core, generada desde su OpenAPI (NestJS
// @nestjs/swagger). Un único spec: starlight-openapi lo sub-agrupa por tag
// (Autenticación, AWBs, Lockers…) dentro de una sola sección "Referencia API".
// Regenerar con `pnpm openapi:gen` en crs-core y copiar openapi.json aquí.
const openAPIPlugin = starlightOpenAPI([
	{
		base: 'core/api',
		label: 'Referencia API',
		schema: './src/openapi/crs-core.json',
	},
]);

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
				// Diagramas con el tema por defecto de Mermaid (se adapta a claro/oscuro
				// vía darkScheme 'class'). strategy 'inline' = 0 JS al navegador.
				[rehypeMermaid, { strategy: 'inline', darkScheme: 'class', cache }],
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
			plugins: [openAPIPlugin],
			sidebar: [
				{ label: 'Empezar aquí', slug: 'empezar' },
				{
					label: 'Backends',
					items: [
						{
							label: 'crs-core',
							items: [
								{ label: 'Visión general', slug: 'core' },
								{ label: 'Autenticación', slug: 'core/authentication' },
								{ label: 'Autorización', slug: 'core/authorization' },
								// Grupos de endpoints generados (uno por área registrada arriba).
								// starlight-openapi los inserta en este único punto.
								...openAPISidebarGroups,
							],
						},
						{ label: 'crs-lastmile', slug: 'lastmile' },
					],
				},
				{
					label: 'Frontends web',
					items: [
						{ label: 'crs-backoffice', slug: 'backoffice' },
						{ label: 'crs-portal', slug: 'portal' },
						{ label: 'crs-business', slug: 'business' },
					],
				},
				{
					label: 'Móvil',
					items: [{ label: 'crs-field (CRS Go)', slug: 'field' }],
				},
			],
		}),
	],
});
