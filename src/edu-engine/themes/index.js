import classic from '@/edu-engine/themes/classic';
import temple from '@/edu-engine/themes/temple';

export const themes = {
	[classic.id]: classic,
	[temple.id]: temple,
};

export const themeList = Object.values(themes);

export const DEFAULT_THEME_ID = classic.id;

export function getTheme(id) {
	return themes[id] || themes[DEFAULT_THEME_ID];
}

export { classic, temple };
