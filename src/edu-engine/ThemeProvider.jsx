import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { getTheme, DEFAULT_THEME_ID } from '@/edu-engine/themes';

const EduThemeContext = createContext(null);

/**
 * Scopes a theme's tokens to a subtree. Tokens land as CSS custom properties on
 * a wrapper element rather than on :root, so an edu-engine lesson can sit inside
 * the existing site chrome without repainting the rest of the page.
 */
export function EduThemeProvider({ themeId = DEFAULT_THEME_ID, mode = 'light', children, className = '' }) {
	const theme = getTheme(themeId);
	const ref = useRef(null);

	const tokens = useMemo(() => {
		const base = theme.tokens || {};
		const dark = mode === 'dark' ? theme.darkTokens || {} : {};
		const ornament = theme.ornament || {};
		// Ornaments become tokens too, so CSS can reference them without knowing
		// which theme is active. A theme that ships none resolves to `none`.
		const ornamentTokens = {
			'edu-ornament-divider': ornament.divider || 'none',
			'edu-ornament-jali': ornament.jali || 'none',
		};
		return { ...base, ...dark, ...ornamentTokens };
	}, [theme, mode]);

	useEffect(() => {
		const node = ref.current;
		if (!node) return undefined;

		const applied = Object.keys(tokens);
		applied.forEach((key) => {
			node.style.setProperty(`--${key}`, tokens[key]);
		});

		return () => {
			applied.forEach((key) => {
				node.style.removeProperty(`--${key}`);
			});
		};
	}, [tokens]);

	const value = useMemo(() => ({ theme, themeId: theme.id, mode, tokens }), [theme, mode, tokens]);

	return (
		<EduThemeContext.Provider value={value}>
			<div
				ref={ref}
				data-edu-theme={theme.id}
				data-edu-mode={mode}
				className={`edu-root ${className}`}
			>
				{children}
			</div>
		</EduThemeContext.Provider>
	);
}

export function useEduTheme() {
	const ctx = useContext(EduThemeContext);
	if (!ctx) {
		// Blocks are usable outside a provider; they just fall back to the default.
		return { theme: getTheme(DEFAULT_THEME_ID), themeId: DEFAULT_THEME_ID, mode: 'light', tokens: {} };
	}
	return ctx;
}

export default EduThemeProvider;
