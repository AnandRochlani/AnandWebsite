import React, { useState } from 'react';
import { Info, Lightbulb, AlertTriangle, OctagonAlert, Check, X } from 'lucide-react';
import { useEduTheme } from '@/edu-engine/ThemeProvider';

/* ---------------------------------------------------------------- ornament */

export function Divider() {
	const { theme } = useEduTheme();
	const bare = !theme.ornament?.divider;
	return <div className="edu-divider" data-empty={bare} role="presentation" />;
}

/* ------------------------------------------------------------------- prose */

export function Heading({ level = 2, id, children }) {
	const Tag = level === 3 ? 'h3' : 'h2';
	return (
		<Tag id={id} className={`edu-heading edu-heading--${level === 3 ? 3 : 2}`}>
			{children}
		</Tag>
	);
}

export function Prose({ children }) {
	return <p className="edu-prose">{children}</p>;
}

export function List({ ordered = false, items = [] }) {
	const Tag = ordered ? 'ol' : 'ul';
	return (
		<Tag className="edu-list">
			{items.map((item, i) => (
				<li key={i}>{item}</li>
			))}
		</Tag>
	);
}

/* ---------------------------------------------------------------- callouts */

const CALLOUT_ROLES = {
	note: { label: 'Note', icon: Info, accent: 'edu-note', bg: 'edu-note-bg' },
	tip: { label: 'Tip', icon: Lightbulb, accent: 'edu-tip', bg: 'edu-tip-bg' },
	warning: { label: 'Watch out', icon: AlertTriangle, accent: 'edu-warn', bg: 'edu-warn-bg' },
	danger: { label: 'Common mistake', icon: OctagonAlert, accent: 'edu-danger', bg: 'edu-danger-bg' },
};

export function Callout({ role = 'note', title, children }) {
	const spec = CALLOUT_ROLES[role] || CALLOUT_ROLES.note;
	const Icon = spec.icon;

	// Role colours are resolved into local custom properties so the shared
	// .edu-callout rules stay role-agnostic.
	const style = {
		'--edu-callout-accent': `var(--${spec.accent})`,
		'--edu-callout-bg': `var(--${spec.bg})`,
		'--edu-callout-border': `var(--edu-border)`,
	};

	return (
		<aside className="edu-callout" style={style} data-role={role}>
			<Icon className="edu-callout__icon" size={20} aria-hidden="true" />
			<div className="edu-callout__body">
				<span className="edu-callout__label">{title || spec.label}</span>
				{children}
			</div>
		</aside>
	);
}

/* -------------------------------------------------------------------- code */

export function CodeBlock({ language = 'text', filename, code = '' }) {
	return (
		<div className="edu-code">
			<div className="edu-code__bar">
				<span>{language}</span>
				{filename ? <span className="edu-code__file">{filename}</span> : null}
			</div>
			<pre>
				<code>{code}</code>
			</pre>
		</div>
	);
}

/* -------------------------------------------------------------------- quiz */

export function Quiz({ question, options = [], answerIndex = 0, explanation }) {
	const [picked, setPicked] = useState(null);
	const answered = picked !== null;

	const stateFor = (i) => {
		if (!answered) return 'idle';
		if (i === answerIndex) return 'correct';
		if (i === picked) return 'wrong';
		return 'idle';
	};

	return (
		<div className="edu-quiz">
			<p className="edu-quiz__q">{question}</p>
			<ul className="edu-quiz__options">
				{options.map((option, i) => {
					const state = stateFor(i);
					return (
						<li key={i}>
							<button
								type="button"
								className="edu-quiz__option"
								data-state={state}
								disabled={answered}
								onClick={() => setPicked(i)}
							>
								<span className="edu-quiz__marker" aria-hidden="true">
									{state === 'correct' ? <Check size={13} /> : null}
									{state === 'wrong' ? <X size={13} /> : null}
									{state === 'idle' ? String.fromCharCode(65 + i) : null}
								</span>
								<span>{option}</span>
							</button>
						</li>
					);
				})}
			</ul>
			{answered && explanation ? (
				<p className="edu-quiz__explain">
					<strong>{picked === answerIndex ? 'Correct. ' : 'Not quite. '}</strong>
					{explanation}
				</p>
			) : null}
		</div>
	);
}

/* ------------------------------------------------------------------ figure */

export function Figure({ src, alt = '', caption, children }) {
	return (
		<figure className="edu-figure">
			<div className="edu-figure__frame">{children || <img src={src} alt={alt} loading="lazy" />}</div>
			{caption ? <figcaption>{caption}</figcaption> : null}
		</figure>
	);
}

/* -------------------------------------------------------------- key points */

export function KeyPoints({ title = 'Key points', items = [] }) {
	return (
		<section className="edu-keypoints">
			<h3 className="edu-keypoints__title">{title}</h3>
			<List items={items} />
		</section>
	);
}

/* -------------------------------------------------------- block dispatcher */

const BLOCKS = {
	heading: ({ level, text, id }) => (
		<Heading level={level} id={id}>
			{text}
		</Heading>
	),
	prose: ({ text }) => <Prose>{text}</Prose>,
	list: ({ ordered, items }) => <List ordered={ordered} items={items} />,
	callout: ({ role, title, text }) => (
		<Callout role={role} title={title}>
			<Prose>{text}</Prose>
		</Callout>
	),
	code: ({ language, filename, code }) => (
		<CodeBlock language={language} filename={filename} code={code} />
	),
	quiz: ({ question, options, answerIndex, explanation }) => (
		<Quiz question={question} options={options} answerIndex={answerIndex} explanation={explanation} />
	),
	figure: ({ src, alt, caption }) => <Figure src={src} alt={alt} caption={caption} />,
	keypoints: ({ title, items }) => <KeyPoints title={title} items={items} />,
	divider: () => <Divider />,
};

/**
 * Renders one block descriptor. Unknown block types are skipped rather than
 * thrown, so a lesson authored against a newer engine still renders.
 */
export function Block({ block }) {
	const render = BLOCKS[block?.type];
	if (!render) return null;
	return render(block);
}

export default Block;
