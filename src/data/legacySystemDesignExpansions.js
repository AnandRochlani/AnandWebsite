const COURSE_URL =
  'https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73';

const topics = {
  1: {
    focus:
      'Latency is the time a single operation takes from the client starting it to the client receiving a useful result.',
    mechanism:
      'End-to-end latency is a budget made from network travel, queueing, application work, storage access, serialization, and the return trip. The slowest component and the longest queues usually dominate.',
    example:
      'For a product-search request, allocate 40 ms to the network, 25 ms to authentication and routing, 60 ms to cache or database work, 30 ms to ranking, and 25 ms to serialization and return travel. That 180 ms target immediately reveals which dependency can break the experience.',
    decisions: [
      'Measure percentiles, especially p95 and p99, because an average hides the slow requests real users remember.',
      'Reduce round trips by batching independent reads and running non-dependent calls concurrently.',
      'Move frequently read data closer to users with caching or edge delivery, while defining how stale that data may be.',
      'Protect dependencies with timeouts, bounded retries, circuit breakers, and queue limits so one slow service cannot consume every worker.',
    ],
    failures: [
      'Retry storms multiply traffic when a dependency is already slow.',
      'Unbounded queues improve apparent throughput briefly but make waiting time explode.',
      'Cache misses send synchronized traffic to storage and create a long latency tail.',
      'Cross-region calls add network variance that a healthy local benchmark never shows.',
    ],
    signals: ['p50, p95, and p99 duration', 'queue wait time', 'dependency duration', 'timeout and retry rate'],
  },
  2: {
    focus:
      'System design turns product requirements into components, data flows, interfaces, and operating rules that continue to work as traffic and failure rates grow.',
    mechanism:
      'A sound design starts with scope and estimates, chooses a simple request path, then adds scaling, durability, and failure isolation only where a stated requirement needs them.',
    example:
      'For a read-heavy learning platform, begin with clients, an API layer, an application service, a relational database, and object storage. Estimate peak reads and writes, add a cache for popular course metadata, use a CDN for video assets, and define what happens when the cache or one application instance fails.',
    decisions: [
      'Clarify functional requirements and name what is explicitly out of scope before drawing components.',
      'Estimate peak requests, storage growth, object sizes, and bandwidth so capacity choices have numbers behind them.',
      'Choose data ownership and consistency from user-visible invariants rather than from a preferred database brand.',
      'Define observability, degradation, recovery, and deployment boundaries as part of the architecture, not as an afterthought.',
    ],
    failures: [
      'Starting with microservices creates boundaries before the data and team boundaries are understood.',
      'Designing for an imaginary billion users adds cost while leaving the real bottleneck unexplained.',
      'Ignoring write paths makes a read-optimized diagram fail when data changes.',
      'Treating every dependency as perfectly available leaves no answer for partial failure.',
    ],
    signals: ['request rate and error rate', 'resource saturation', 'data growth', 'availability and recovery time'],
  },
  3: {
    focus:
      'Vertical scaling gives one machine more CPU, memory, or storage; horizontal scaling adds more machines and divides work between them.',
    mechanism:
      'Scale up first when simplicity matters and the workload fits one failure domain. Scale out when traffic, availability, or data size exceeds a single host, then add routing, partitioning, coordination, and rebalancing.',
    example:
      'A database may move from 4 to 16 CPU cores to buy immediate headroom. As reads continue growing, replicas can spread read traffic. When the write set or storage no longer fits one primary, partition by a stable key and plan how partitions rebalance as nodes join.',
    decisions: [
      'Identify whether CPU, memory, network, storage capacity, or storage latency is the actual constraint.',
      'Prefer stateless application instances because a load balancer can add or remove them without moving user sessions.',
      'Choose a partition key with enough cardinality and even traffic distribution to avoid hotspots.',
      'Budget for coordination, replication, deployment, and observability costs introduced by additional nodes.',
    ],
    failures: [
      'Sticky in-memory sessions prevent traffic from moving safely between instances.',
      'A low-cardinality partition key sends most requests to one shard.',
      'Scaling application servers cannot repair an overloaded shared database.',
      'Adding nodes without load testing only moves the bottleneck to a network or downstream service.',
    ],
    signals: ['CPU and memory saturation', 'requests per instance', 'partition skew', 'scale-up and scale-out time'],
  },
  4: {
    focus:
      'Throughput is the amount of useful work a system completes per unit of time, commonly requests per second, messages per second, or bytes per second.',
    mechanism:
      'Throughput depends on concurrency, service time, resource limits, and backpressure. It rises only until a saturated resource forms a queue; after that, additional load mostly increases latency and errors.',
    example:
      'If one worker completes a request in 100 ms, it can finish roughly 10 sequential requests per second. Twenty independent workers could approach 200 requests per second, but only if the database connection pool, CPU, and network also have capacity. A 50-connection database pool becomes the real ceiling first.',
    decisions: [
      'Separate arrival rate from completion rate so growing queues cannot masquerade as healthy capacity.',
      'Batch small operations when the fixed per-request overhead is significant.',
      'Use bounded concurrency and backpressure to keep accepted work within downstream capacity.',
      'Load test the whole critical path and record the first resource that saturates.',
    ],
    failures: [
      'An unbounded consumer backlog makes dashboards show ingestion success while users wait hours.',
      'Large batches raise throughput but can violate latency targets and make retries expensive.',
      'A shared connection pool limits every application instance even after horizontal scaling.',
      'Autoscaling reacts too slowly when traffic increases faster than new instances become ready.',
    ],
    signals: ['arrival and completion rate', 'queue depth and age', 'resource utilization', 'rejection and error rate'],
  },
  5: {
    focus:
      'A load balancer accepts traffic and selects a healthy backend so capacity can grow horizontally without clients tracking individual servers.',
    mechanism:
      'Layer 4 balancers route using connection information; Layer 7 balancers can inspect HTTP hosts, paths, headers, and cookies. Selection algorithms must be paired with health checks, connection draining, and overload protection.',
    example:
      'For an API with six instances, round robin is adequate when requests cost roughly the same. If long-lived uploads create uneven work, least-connections or power-of-two choices responds better. During a deployment, readiness checks admit a new instance only after warm-up and draining lets old connections finish.',
    decisions: [
      'Choose Layer 4 for lower overhead or Layer 7 when content-based routing, TLS termination, or HTTP policy is required.',
      'Use health checks that reflect readiness without making a temporary downstream issue remove every backend.',
      'Keep application state external so requests do not require fragile session affinity.',
      'Set per-backend connection limits and shed excess load before queues exhaust memory.',
    ],
    failures: [
      'A shallow health endpoint reports healthy while the application cannot reach its database.',
      'Aggressive health checks create synchronized traffic and flap instances in and out of service.',
      'Session affinity concentrates heavy users on one backend.',
      'The balancer itself becomes a single failure domain without redundancy or managed failover.',
    ],
    signals: ['healthy backend count', 'requests and connections per backend', 'upstream errors', 'drain and failover time'],
  },
  6: {
    focus:
      'A cache stores reusable results in a faster layer so repeated requests avoid expensive computation, database access, or network travel.',
    mechanism:
      'Cache-aside loads misses on demand, write-through updates cache and storage together, write-behind buffers storage writes, and refresh-ahead renews hot entries before expiry. Each pattern makes a different consistency and failure trade-off.',
    example:
      'For product details, cache-aside can read Redis first and query the database on a miss. Use a five-minute TTL with event-driven invalidation after an update. Add request coalescing so one miss loads the value while concurrent requests wait instead of all hitting the database.',
    decisions: [
      'Choose keys and TTLs from access frequency, update frequency, object size, and acceptable staleness.',
      'Define invalidation before rollout; a cache without an ownership rule becomes a second inconsistent database.',
      'Protect hot keys with replication, local caching, or key splitting where a single entry receives extreme traffic.',
      'Cap memory and select an eviction policy that matches whether recent, frequent, or explicitly prioritized data matters.',
    ],
    failures: [
      'Cache stampedes send many identical misses to storage when a popular key expires.',
      'Cache penetration repeatedly queries storage for nonexistent keys.',
      'A synchronized TTL expires a large key set at once and creates a traffic spike.',
      'Write-behind loses acknowledged changes if the buffer fails before durable persistence.',
    ],
    signals: ['hit and miss ratio', 'load latency', 'eviction rate', 'stale-read and origin request rate'],
  },
  7: {
    focus:
      'Replication copies data for availability and read scale, while sharding divides data so storage and write load can grow beyond one database.',
    mechanism:
      'Replication introduces lag, failover, and consistency choices. Sharding introduces routing, rebalancing, cross-shard queries, and hotspot risks. They solve different constraints and are often combined.',
    example:
      'A global catalog can use one write primary and regional read replicas when slightly stale browsing is acceptable. Orders require read-your-writes after checkout, so route those reads to the primary or track a replication position. When one primary cannot hold all orders, shard by customer ID and replicate each shard.',
    decisions: [
      'Start from invariants: which writes must be unique, which reads may be stale, and which transactions must remain atomic.',
      'Choose a shard key that distributes both data volume and request volume while supporting common queries.',
      'Plan resharding with virtual partitions or a routing directory instead of baking physical node counts into clients.',
      'Specify replica promotion, split-brain prevention, backup restore, and recovery point objectives.',
    ],
    failures: [
      'Replica lag shows users stale state immediately after a successful write.',
      'A time-based or geographic shard receives disproportionate current traffic.',
      'Cross-shard joins and transactions turn ordinary queries into distributed coordination.',
      'Automatic failover promotes an incomplete replica and loses acknowledged writes.',
    ],
    signals: ['replication lag', 'shard size and request skew', 'failover duration', 'conflict and transaction-abort rate'],
  },
  8: {
    focus:
      'Microservices split a product into independently deployable services with explicit ownership of behavior and data.',
    mechanism:
      'The useful boundary follows a business capability and team ownership, not an arbitrary technical layer. Services communicate through versioned APIs or events and must tolerate partial failure because a local call has become a network call.',
    example:
      'An order workflow can separate checkout, payment, inventory, and fulfillment only when each capability has clear ownership. The checkout service creates a pending order, publishes an event through a transactional outbox, and a saga coordinates compensation if payment succeeds but inventory reservation fails.',
    decisions: [
      'Begin with a modular monolith unless independent scaling, release cadence, or organizational ownership justifies distribution.',
      'Give each service authority over its data and expose behavior instead of allowing cross-service table access.',
      'Use synchronous calls for immediate answers and events for decoupling, buffering, and fan-out.',
      'Design idempotency, tracing, timeouts, retries, and schema evolution before traffic depends on the service boundary.',
    ],
    failures: [
      'A distributed monolith requires many services to deploy together and combines network risk with tight coupling.',
      'Retrying non-idempotent commands creates duplicate payments, messages, or orders.',
      'Long synchronous call chains multiply latency and availability risk.',
      'Shared databases let one service bypass another service’s invariants.',
    ],
    signals: ['end-to-end trace duration', 'dependency error rate', 'event lag and dead letters', 'deployment and rollback frequency'],
  },
  9: {
    focus:
      'A URL shortener maps a compact, unique code to a destination URL and redirects reads with very low latency.',
    mechanism:
      'The design needs an ID-generation strategy, a durable mapping store, a redirect API, caching for popular codes, abuse controls, and clear behavior for expiration and deletion.',
    example:
      'Estimate 100 million new links per month and a 100:1 read-to-write ratio. Generate a unique numeric ID, encode it in Base62, store the code-to-URL mapping, and cache popular mappings. Redirect with 302 when analytics or destination changes matter; use 301 only for intentionally permanent mappings.',
    decisions: [
      'Choose random codes, range-allocated sequence IDs, or a distributed ID service based on collision handling and predictability requirements.',
      'Partition mappings by a stable hash of the short code so popular creation times do not hotspot one shard.',
      'Keep redirect reads on a short path with cache-aside lookup and negative caching for invalid codes.',
      'Add rate limits, malware checks, ownership rules, and asynchronous analytics without delaying redirects.',
    ],
    failures: [
      'A predictable sequence exposes business volume and makes enumeration easier.',
      'A hot viral link overloads one cache node or storage partition.',
      'Synchronous click analytics increases redirect latency and availability coupling.',
      'Deleted or expired codes are immediately reused and redirect old links to an unrelated destination.',
    ],
    signals: ['redirect p95 and p99 latency', 'cache hit ratio', 'code creation and collision rate', 'invalid and abusive request rate'],
  },
};

const list = (items, topic) =>
  items
    .map(
      (item, index) =>
        `<li><strong>${index + 1}.</strong> ${item} For ${topic}, document the expected behavior, the capacity assumption behind it, and the fallback when that assumption stops being true.</li>`
    )
    .join('\n');

const paragraphs = (items) =>
  items
    .map(
      (item) =>
        `<p>${item} In production, validate this with a small experiment or load test, then expose a metric and an alert that show whether the decision still holds. In an interview, state the trade-off plainly instead of presenting the choice as universally correct.</p>`
    )
    .join('\n');

function addon(topic, config) {
  return `
    <h2>A Practical Mental Model for ${topic}</h2>
    <p>${config.focus} The definition matters, but the more useful skill is connecting it to a user-visible goal and a measurable operating limit. A design is convincing when it explains what improves, what becomes more complex, and what evidence would trigger the next change.</p>
    <p>${config.mechanism} Draw the critical request path first. For every hop, name the work performed, the state read or changed, and the way that hop can fail. This prevents a diagram full of boxes from hiding the actual behavior.</p>
    <p>A simple way to reason about ${topic.toLowerCase()} is to separate four concerns: correctness, performance, availability, and operability. Correctness protects user and business invariants. Performance defines latency and capacity. Availability describes degradation during failure. Operability covers deployment, observation, recovery, and cost. Improving one concern can make another harder, so every design choice needs a stated priority.</p>

    <h2>Worked Example and Capacity Reasoning</h2>
    <p>${config.example}</p>
    <p>Turn the narrative into numbers before selecting infrastructure. Estimate average and peak request rates, the read-to-write ratio, payload size, retained data, and acceptable response time. Add headroom for traffic bursts and failures, but show the arithmetic. The goal is not a perfect forecast; it is to distinguish a design that needs one machine from one that needs partitioning, replication, or asynchronous processing.</p>
    <p>Next, trace one successful request and one failed request. The successful trace validates the normal data flow. The failed trace forces decisions about timeouts, retries, idempotency, stale data, and user feedback. If the system can only be explained while every dependency is healthy, the design is incomplete.</p>

    <h2>Design Decisions to Make Explicit</h2>
    ${paragraphs(config.decisions)}
    <p>These decisions should appear next to the component they affect. A short annotation such as “p99 under 250 ms,” “eventual consistency under 30 seconds,” or “survives one availability-zone failure” makes the diagram testable. Without a target, terms such as fast, scalable, and highly available are only aspirations.</p>

    <h2>Common Failure Modes</h2>
    <ul>${list(config.failures, topic)}</ul>
    <p>Do not try to eliminate every failure. Decide which failures must be masked, which can produce a degraded response, and which should reject new work quickly. Bounded queues, deadlines, bulkheads, and circuit breakers are often safer than unlimited retries. Recovery also needs verification: regularly test restores, failovers, rebalancing, and rollback paths before an incident makes them necessary.</p>

    <h2>Observability and Production Readiness</h2>
    <p>At minimum, monitor ${config.signals.join(', ')}. Break metrics down by endpoint, dependency, region, or partition where an aggregate could conceal a hotspot. Pair metrics with structured logs for local detail and distributed traces for request paths that cross service boundaries.</p>
    <p>Alerts should describe user impact or exhausted safety margin, not every small fluctuation. Use service-level objectives to connect telemetry to a promise: for example, 99.9% of valid requests succeed and 99% finish within the target latency over a rolling window. Add dashboards for traffic, errors, duration, saturation, and deployment markers so an operator can see whether a regression began with load, a dependency, or a release.</p>
    <p>Capacity planning is continuous. Record the tested limit, current peak, growth rate, and time required to add capacity. If the system needs thirty minutes to scale safely, an alert at ninety-nine percent utilization is too late. Operational readiness is part of system design because a component that cannot be observed or recovered is not dependable.</p>

    <h2>How to Explain This in a System Design Interview</h2>
    <ol>
      <li><strong>Clarify the requirement.</strong> Ask which user action depends on ${topic.toLowerCase()} and define the success target.</li>
      <li><strong>Estimate demand.</strong> Calculate peak traffic, data size, and the ratio that drives the design.</li>
      <li><strong>Start simple.</strong> Present the smallest architecture that meets the current requirement before adding distributed machinery.</li>
      <li><strong>Find the limit.</strong> Explain which resource or failure domain breaks first and how you know.</li>
      <li><strong>Evolve the design.</strong> Add the next mechanism, then state its cost, consistency effect, and operational burden.</li>
      <li><strong>Close with failure handling.</strong> Walk through one dependency failure and the metrics that reveal it.</li>
    </ol>
    <p>This sequence demonstrates judgment. Interviewers usually care less about naming a particular product than about whether you can defend boundaries and adapt when a requirement changes. If a managed service is useful, describe the capability you need first, then mention the product as one implementation.</p>

    <h2>Review Checklist</h2>
    <ul>
      <li>Is the functional scope clear, including what is deliberately excluded?</li>
      <li>Are peak traffic, storage, bandwidth, and latency targets quantified?</li>
      <li>Does every important write have an owner, durability rule, and idempotency strategy?</li>
      <li>Are consistency and staleness visible to the user explained?</li>
      <li>Can the design tolerate one instance, zone, or dependency failure as required?</li>
      <li>Are queues and retries bounded, and is overload rejected or degraded intentionally?</li>
      <li>Can an operator detect, diagnose, roll back, and recover the system?</li>
      <li>Is the next scaling step identified without paying for it prematurely?</li>
    </ul>

    <p><strong>Want a guided way to practice these trade-offs?</strong> Continue in
    <a href="${COURSE_URL}" target="_blank" rel="sponsored noopener noreferrer">System Design Fundamentals for Interviews on Udemy</a>,
    which connects the concepts through complete interview case studies.</p>

    <h2>Continue Learning</h2>
    <p>Use the <a href="/blog/system-design-interview-preparation-complete-guide-2026">complete System Design interview-preparation guide</a> to place this topic in a four-week roadmap. Then apply the same reasoning to the <a href="/system-design-case-studies">System Design case-study collection</a>, where requirements, estimates, bottlenecks, and failure modes are combined in end-to-end designs.</p>
  `;
}

export function expandLegacySystemDesignPosts(posts) {
  return posts.map((post) => {
    const config = topics[Number(post.order)];
    if (post.category !== 'System Design' || !config) return post;
    return {
      ...post,
      content: `${post.content}${addon(post.title.split(':')[0], config)}`,
      readTime: '10 min read',
    };
  });
}
