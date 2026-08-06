/**
 * Temple theme — a Bharat-temple visual language for lesson content.
 *
 * Palette is drawn from temple materials rather than from screen colours:
 * sandstone walls, kumkum and saffron, brass lamp gold, peacock blue-green,
 * and the deep sindoor red used on sanctum doorframes.
 */

const temple = {
	id: 'temple',
	name: 'Temple',
	description: 'Sandstone, saffron and brass — a Bharat-temple reading surface.',

	// Applied to :root as CSS custom properties by ThemeProvider.
	tokens: {
		// Surfaces
		'edu-bg': '#FBF4E6',
		'edu-bg-2': '#F5E9D2',
		'edu-surface': '#FFFDF7',
		'edu-surface-2': '#F7EEDC',
		'edu-sunken': '#EFE1C6',

		// Text
		'edu-ink': '#2B1810',
		'edu-ink-2': '#5A4231',
		'edu-ink-3': '#8A705A',
		'edu-on-accent': '#FFFDF7',

		// Brand / accents
		'edu-saffron': '#E07A28',
		'edu-terracotta': '#C1440E',
		'edu-sindoor': '#7B1E22',
		'edu-brass': '#C9A227',
		'edu-brass-soft': '#E4C56B',
		'edu-peacock': '#0F6F6C',

		// Semantic roles the blocks actually consume
		'edu-primary': '#C1440E',
		'edu-primary-hover': '#A2380B',
		'edu-accent': '#C9A227',
		'edu-link': '#0F6F6C',
		'edu-border': '#D9C4A0',
		'edu-border-strong': '#B99C6E',
		'edu-ring': 'rgba(193, 68, 14, 0.45)',

		// Callout roles
		'edu-note': '#0F6F6C',
		'edu-note-bg': '#E6F0EE',
		'edu-tip': '#7A6A16',
		'edu-tip-bg': '#F7EFD3',
		'edu-warn': '#8A4B08',
		'edu-warn-bg': '#FAEBD8',
		'edu-danger': '#7B1E22',
		'edu-danger-bg': '#F7E3E1',

		// Code surface — the one deliberately dark band, like a sanctum interior
		'edu-code-bg': '#241609',
		'edu-code-ink': '#F0DFC0',
		'edu-code-border': '#4A3113',

		// Shape & type
		'edu-radius': '10px',
		'edu-radius-lg': '16px',
		'edu-font-display': "'Cormorant Garamond', 'Marcellus', Georgia, serif",
		'edu-font-body': "'DM Sans', system-ui, sans-serif",
		'edu-font-mono': "'JetBrains Mono', 'SF Mono', Menlo, monospace",
		'edu-shadow': '0 1px 2px rgba(43, 24, 16, 0.06), 0 8px 24px rgba(43, 24, 16, 0.08)',
	},

	// Dark variant — night aarti: lamp-lit stone rather than inverted paper.
	darkTokens: {
		'edu-bg': '#160F0A',
		'edu-bg-2': '#1E140C',
		'edu-surface': '#241810',
		'edu-surface-2': '#2E1F14',
		'edu-sunken': '#120C07',

		'edu-ink': '#F2E4CC',
		'edu-ink-2': '#CDB694',
		'edu-ink-3': '#9C8161',
		'edu-on-accent': '#160F0A',

		'edu-primary': '#E8823A',
		'edu-primary-hover': '#F0975A',
		'edu-accent': '#E4C56B',
		'edu-link': '#5FBDB4',
		'edu-border': '#3E2B1B',
		'edu-border-strong': '#5C4227',
		'edu-ring': 'rgba(232, 130, 58, 0.5)',

		'edu-note': '#5FBDB4',
		'edu-note-bg': '#12241F',
		'edu-tip': '#E4C56B',
		'edu-tip-bg': '#261E0C',
		'edu-warn': '#E0A458',
		'edu-warn-bg': '#2A1C0B',
		'edu-danger': '#E2716F',
		'edu-danger-bg': '#2A1210',

		'edu-code-bg': '#0E0906',
		'edu-code-ink': '#EBD9B8',
		'edu-code-border': '#3E2B1B',

		'edu-shadow': '0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.45)',
	},

	/**
	 * Ornament set. Blocks ask the theme for these rather than hard-coding
	 * decoration, so a non-temple theme can return empty strings and the
	 * layout stays intact.
	 */
	ornament: {
		// Stepped gopuram silhouette used above section headings.
		divider:
			"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='16' viewBox='0 0 120 16'%3E%3Cpath d='M60 0l6 5h-4v3h5l5 4h-6v4h-12v-4h-6l5-4h5V5h-4z' fill='%23C9A227'/%3E%3Cpath d='M0 15h44M76 15h44' stroke='%23D9C4A0' stroke-width='1.5'/%3E%3C/svg%3E\")",
		// Jali lattice, used at very low opacity behind hero surfaces.
		jali:
			"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='none' stroke='%23C1440E' stroke-width='1'%3E%3Cpath d='M20 0l20 20-20 20L0 20z'/%3E%3Ccircle cx='20' cy='20' r='7'/%3E%3C/g%3E%3C/svg%3E\")",
		// Torana arch clipped onto lesson cards.
		arch: 'polygon(0% 12%, 8% 4%, 20% 0%, 50% 0%, 80% 0%, 92% 4%, 100% 12%, 100% 100%, 0% 100%)',
	},
};

export default temple;
