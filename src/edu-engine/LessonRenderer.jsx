import React from 'react';
import { Clock, BookOpen } from 'lucide-react';
import { EduThemeProvider } from '@/edu-engine/ThemeProvider';
import { Block, Divider } from '@/edu-engine/blocks';
import '@/edu-engine/edu-engine.css';

/**
 * Renders a lesson document with a given theme.
 *
 * A lesson is plain data — `{ eyebrow, title, summary, minutes, blocks: [] }` —
 * so the same content can be re-themed, prerendered for SEO, or fed to the
 * video pipeline without touching the renderer.
 */
export function LessonRenderer({ lesson, themeId, mode = 'light' }) {
	if (!lesson) return null;

	const { eyebrow, title, summary, minutes, level, blocks = [] } = lesson;

	return (
		<EduThemeProvider themeId={themeId} mode={mode}>
			<article className="edu-lesson">
				<header>
					{eyebrow ? <span className="edu-lesson__eyebrow">{eyebrow}</span> : null}
					<h1 className="edu-lesson__title">{title}</h1>
					{summary ? <p className="edu-lesson__summary">{summary}</p> : null}
					<div className="edu-lesson__meta">
						{minutes ? (
							<span>
								<Clock size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
								{minutes} min read
							</span>
						) : null}
						{level ? (
							<span>
								<BookOpen size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
								{level}
							</span>
						) : null}
					</div>
				</header>

				<Divider />

				{blocks.map((block, i) => (
					<Block key={block.id || i} block={block} />
				))}
			</article>
		</EduThemeProvider>
	);
}

export default LessonRenderer;
