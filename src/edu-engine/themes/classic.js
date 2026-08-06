/**
 * Classic theme — the existing site look (brand indigo on white), expressed as
 * edu-engine tokens so the engine has a baseline to fall back to and so the
 * temple theme has something to be compared against.
 */

const classic = {
	id: 'classic',
	name: 'Classic',
	description: 'The current site look — brand indigo on white.',

	tokens: {
		'edu-bg': '#FFFFFF',
		'edu-bg-2': '#F8FAFC',
		'edu-surface': '#FFFFFF',
		'edu-surface-2': '#F1F5F9',
		'edu-sunken': '#EEEEFF',

		'edu-ink': '#0D0B33',
		'edu-ink-2': '#334155',
		'edu-ink-3': '#64748B',
		'edu-on-accent': '#FFFFFF',

		'edu-primary': '#5553FF',
		'edu-primary-hover': '#4341D6',
		'edu-accent': '#B9A8FF',
		'edu-link': '#4341D6',
		'edu-border': '#E2E8F0',
		'edu-border-strong': '#CBD5E1',
		'edu-ring': 'rgba(85, 83, 255, 0.55)',

		'edu-note': '#4341D6',
		'edu-note-bg': '#EEEEFF',
		'edu-tip': '#0F766E',
		'edu-tip-bg': '#ECFDF5',
		'edu-warn': '#B45309',
		'edu-warn-bg': '#FFFBEB',
		'edu-danger': '#B91C1C',
		'edu-danger-bg': '#FEF2F2',

		'edu-code-bg': '#0D0B33',
		'edu-code-ink': '#E2E8F0',
		'edu-code-border': '#1E1B4B',

		'edu-radius': '8px',
		'edu-radius-lg': '14px',
		'edu-font-display': "'DM Sans', system-ui, sans-serif",
		'edu-font-body': "'DM Sans', system-ui, sans-serif",
		'edu-font-mono': "'JetBrains Mono', 'SF Mono', Menlo, monospace",
		'edu-shadow': '0 1px 2px rgba(13, 11, 51, 0.06), 0 8px 24px rgba(13, 11, 51, 0.08)',
	},

	darkTokens: {
		'edu-bg': '#0B0A1F',
		'edu-bg-2': '#12102E',
		'edu-surface': '#171450',
		'edu-surface-2': '#1E1B5C',
		'edu-sunken': '#0D0B33',

		'edu-ink': '#F1F5F9',
		'edu-ink-2': '#CBD5E1',
		'edu-ink-3': '#94A3B8',
		'edu-on-accent': '#0B0A1F',

		'edu-primary': '#8785FF',
		'edu-primary-hover': '#A5A3FF',
		'edu-accent': '#B9A8FF',
		'edu-link': '#B9A8FF',
		'edu-border': '#2A2668',
		'edu-border-strong': '#3D3888',
		'edu-ring': 'rgba(135, 133, 255, 0.55)',

		'edu-note': '#B9A8FF',
		'edu-note-bg': '#1B1750',
		'edu-tip': '#5EEAD4',
		'edu-tip-bg': '#0F2E2A',
		'edu-warn': '#FCD34D',
		'edu-warn-bg': '#2E240A',
		'edu-danger': '#FCA5A5',
		'edu-danger-bg': '#2E1113',

		'edu-code-bg': '#07061A',
		'edu-code-ink': '#E2E8F0',
		'edu-code-border': '#2A2668',

		'edu-shadow': '0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.45)',
	},

	ornament: {
		divider: '',
		jali: '',
		arch: '',
	},
};

export default classic;
