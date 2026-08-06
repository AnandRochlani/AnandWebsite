/**
 * A representative lesson used to preview themes. It deliberately exercises
 * every block type the engine ships, so a theme that looks right here looks
 * right on real content.
 */

const sampleLesson = {
	id: 'lld-01-what-is-lld',
	eyebrow: 'Low-Level Design · Lesson 01',
	title: 'What Low-Level Design actually asks of you',
	summary:
		'High-level design decides which boxes exist. Low-level design decides what lives inside one box — the classes, the contracts between them, and the reasons a change stays cheap.',
	minutes: 9,
	level: 'Beginner',
	blocks: [
		{
			type: 'prose',
			text:
				'In an HLD round you are asked how a system scales. In an LLD round you are asked how it survives its second year — when three teams edit the same service and nobody remembers the original assumptions.',
		},
		{
			type: 'heading',
			level: 2,
			id: 'the-real-question',
			text: 'The question behind the question',
		},
		{
			type: 'prose',
			text:
				'"Design a parking lot" is not a request for a parking lot. It is a request to watch you take an ambiguous requirement, name the entities, decide which behaviour belongs to which entity, and then defend those boundaries when the interviewer changes the rules.',
		},
		{
			type: 'list',
			items: [
				'Entities — the nouns that own state (Vehicle, Slot, Ticket).',
				'Responsibilities — the verbs, each parked on exactly one entity.',
				'Contracts — the interfaces that let one part change without the others noticing.',
				'Extension points — where tomorrow’s requirement lands without a rewrite.',
			],
		},
		{
			type: 'callout',
			role: 'tip',
			text:
				'Say the entity list out loud before you draw anything. Interviewers grade the boundary decisions far more than the diagram.',
		},
		{ type: 'divider' },
		{
			type: 'heading',
			level: 2,
			id: 'boundaries-in-code',
			text: 'What a good boundary looks like',
		},
		{
			type: 'prose',
			text:
				'Pricing is the classic test. A first draft usually puts the rate table inside the ticket. The second requirement — weekend rates — then edits the ticket. The third — EV charging surcharge — edits it again. The fix is to make pricing its own contract.',
		},
		{
			type: 'code',
			language: 'java',
			filename: 'PricingStrategy.java',
			code: `public interface PricingStrategy {
    Money priceFor(Ticket ticket, Duration stay);
}

public final class WeekendPricing implements PricingStrategy {
    private final Money hourlyRate;

    public WeekendPricing(Money hourlyRate) {
        this.hourlyRate = hourlyRate;
    }

    @Override
    public Money priceFor(Ticket ticket, Duration stay) {
        long hours = Math.max(1, stay.toHours());
        return hourlyRate.times(hours);
    }
}`,
		},
		{
			type: 'prose',
			text:
				'The ticket now holds facts. The strategy holds policy. A new rule arrives as a new class, and no existing file has to be reopened — which is the whole point of the open/closed principle in practice.',
		},
		{
			type: 'callout',
			role: 'danger',
			text:
				'Do not reach for a strategy on the first requirement. One pricing rule needs one method. Introduce the interface when the second rule appears — premature abstraction reads as an anti-pattern too.',
		},
		{
			type: 'quiz',
			question: 'A new requirement adds a flat rate for the first 30 minutes. Where does it belong?',
			options: [
				'An extra if-branch inside Ticket.calculatePrice()',
				'A new PricingStrategy implementation',
				'A boolean flag on Vehicle',
			],
			answerIndex: 1,
			explanation:
				'The rule is policy, not fact, so it belongs beside the other policies. Adding a branch to Ticket puts pricing knowledge back into an entity that should only know what happened, not what it costs.',
		},
		{
			type: 'keypoints',
			title: 'Carry these into the next lesson',
			items: [
				'LLD is boundary work — deciding what each class is allowed to know.',
				'Facts belong to entities; policy belongs to its own contract.',
				'Abstract on the second requirement, not the first.',
				'A design is good when the next change touches one file.',
			],
		},
	],
};

export default sampleLesson;
