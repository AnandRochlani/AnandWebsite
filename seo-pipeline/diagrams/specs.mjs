/**
 * One original diagram per live System Design article.
 *
 * Each entry: { id, slug, alt, caption, ...layoutSpec }
 *  - id      → public/diagrams/<id>.svg and the <img src>
 *  - alt     → <img alt> and the SVG <desc>. Written to be genuinely descriptive:
 *              it must make sense to someone who cannot see the image.
 *  - caption → <figcaption> under the image. Adds context the prose does not repeat.
 *  - after   → optional heading substring; the figure is inserted after that <h2>
 *              section. Default: immediately before the second <h2>.
 */

export const SPECS = [
  /* ------------------------------------------------------------ concepts */
  {
    id: 'request-latency-path',
    slug: 'understanding-latency-a-beginners-guide-to-system-design-fundamentals',
    type: 'flow',
    title: 'Where latency actually comes from',
    kicker: 'A single user request, hop by hop, with a typical time cost at each stage.',
    alt: 'Diagram of a web request passing through DNS lookup, CDN edge, load balancer, application server, cache and database, with typical latency added at each hop, totalling roughly 150 milliseconds.',
    caption: 'Latency is additive. Every hop a request makes adds time, which is why removing a hop (a cache hit that never reaches the database) beats optimising one.',
    columns: [
      { label: 'Client', nodes: [{ label: 'Browser', sub: 'user request' }] },
      { label: 'Resolve', nodes: [{ label: 'DNS', sub: '~20 ms' }], edgeLabel: 'lookup' },
      { label: 'Edge', nodes: [{ label: 'CDN / LB', sub: '~10 ms' }], edgeLabel: 'TLS + route' },
      { label: 'Compute', nodes: [{ label: 'App server', sub: '~30 ms', variant: 'accent' }] },
      {
        label: 'Data',
        nodes: [
          { label: 'Cache', sub: '~1 ms', variant: 'ok' },
          { label: 'Database', sub: '~80 ms', variant: 'warn' },
        ],
      },
    ],
    annotations: [
      { text: 'half your budget, right here', col: 4, node: 1, side: 'below' },
      { text: 'skip this hop →', col: 4, node: 0, side: 'above', dx: -10 },
    ],
  },
  {
    id: 'scalable-architecture-tiers',
    slug: 'system-design-fundamentals-introduction-to-scalable-architecture',
    type: 'flow',
    title: 'The shape almost every scalable system takes',
    kicker: 'Stateless compute in the middle, shared state pushed to the edges.',
    alt: 'Architecture diagram showing clients connecting through a CDN and load balancer to three stateless application servers, which read from a cache and a primary database with read replicas and object storage.',
    caption: 'The application tier is stateless so it can be cloned freely. Everything that holds state — cache, database, object storage — is scaled with different techniques.',
    columns: [
      { label: 'Clients', nodes: [{ label: 'Web' }, { label: 'Mobile' }] },
      { label: 'Edge', nodes: [{ label: 'CDN + load balancer', sub: 'static assets, routing', variant: 'accent' }] },
      {
        label: 'Stateless tier',
        nodes: [{ label: 'App server' }, { label: 'App server' }, { label: 'App server' }],
        edgeLabel: 'distribute',
      },
      {
        label: 'State',
        nodes: [
          { label: 'Cache', sub: 'Redis' },
          { label: 'Database', sub: 'primary + replicas' },
          { label: 'Object store', sub: 'S3' },
        ],
        bus: true,
      },
    ],
  },
  {
    id: 'horizontal-vs-vertical-scaling',
    slug: 'scalability-patterns-horizontal-vs-vertical-scaling',
    type: 'compare',
    title: 'Vertical vs horizontal scaling',
    kicker: 'One machine gets bigger, or many machines share the work.',
    alt: 'Side by side comparison of vertical scaling, which replaces one server with a larger server and has a hardware ceiling and single point of failure, against horizontal scaling, which adds more servers behind a load balancer for near linear capacity and redundancy.',
    caption: 'Vertical scaling is the faster fix and the shorter road. Horizontal scaling costs you statelessness and coordination, and buys you a ceiling you are unlikely to hit.',
    left: {
      title: 'Vertical (scale up)',
      sub: 'one bigger machine',
      rows: [
        'Add CPU, RAM and faster disks to the existing server',
        'No code changes — the simplest thing that works',
        'Hard ceiling: the largest instance money can buy',
        'Still a single point of failure',
        'Downtime is usually required to resize',
      ],
    },
    right: {
      title: 'Horizontal (scale out)',
      sub: 'more machines',
      rows: [
        'Add servers behind a load balancer',
        'Capacity grows close to linearly with machine count',
        'One node dying takes out a fraction of capacity, not the site',
        'Requires stateless app servers and shared session state',
        'Brings coordination problems: consistency, sharding, rebalancing',
      ],
    },
    verdict:
      'Interview answer: start vertical because it is cheap and instant, design for horizontal because it is the only option that keeps going.',
  },
  {
    id: 'throughput-bottleneck',
    slug: 'throughput-explained-a-beginners-guide-to-system-design-scale-2026',
    type: 'flow',
    title: 'Throughput is set by your narrowest stage',
    kicker: 'Each stage can absorb a different rate. The smallest number wins.',
    alt: 'Pipeline diagram showing a load balancer handling fifty thousand requests per second, application servers handling twenty thousand, a cache handling one hundred thousand, and a database handling only five thousand, making the database the bottleneck that caps end to end throughput at five thousand requests per second.',
    caption: 'Adding application servers here changes nothing — the database caps the system at 5k rps. Find the narrowest stage before you scale anything else.',
    columns: [
      { label: 'Ingress', nodes: [{ label: 'Load balancer', sub: '50k rps' }] },
      { label: 'Compute', nodes: [{ label: 'App tier', sub: '20k rps' }], edgeLabel: 'fan out' },
      { label: 'Cache', nodes: [{ label: 'Redis', sub: '100k rps', variant: 'ok' }] },
      {
        label: 'Bottleneck',
        nodes: [{ label: 'Database', sub: '5k rps — the cap', variant: 'warn', stamp: 'BOTTLENECK' }],
        edgeLabel: 'on miss',
      },
    ],
    annotations: [
      { text: 'adding servers here changes nothing', col: 1, side: 'below' },
    ],
  },
  {
    id: 'load-balancer-fanout',
    slug: 'load-balancing-distributing-traffic-across-servers',
    type: 'flow',
    title: 'How a load balancer distributes traffic',
    kicker: 'One address in front, many interchangeable servers behind.',
    alt: 'Diagram showing clients sending requests to a single load balancer, which forwards them to three application servers using round robin, while health checks mark one unhealthy server so it stops receiving traffic.',
    caption: 'The load balancer is also the health monitor. An instance that fails its health check stops receiving traffic before users notice anything.',
    columns: [
      { label: 'Clients', nodes: [{ label: 'Web' }, { label: 'Mobile' }, { label: 'API' }] },
      { label: 'Single entry', nodes: [{ label: 'Load balancer', sub: 'round robin', variant: 'accent' }] },
      {
        label: 'Backends',
        nodes: [
          { label: 'Server 1', sub: 'healthy', variant: 'ok' },
          { label: 'Server 2', sub: 'healthy', variant: 'ok' },
          { label: 'Server 3', sub: 'failed health check', variant: 'warn' },
        ],
        edgeLabel: 'health checks',
      },
    ],
    annotations: [
      { text: 'fails the check → gets no traffic', col: 2, node: 2, side: 'below' },
    ],
  },
  {
    id: 'cache-read-path',
    slug: 'caching-strategies-improving-performance-with-smart-data-storage',
    type: 'flow',
    title: 'Cache-aside: the read path',
    kicker: 'The application owns the cache. The database is only touched on a miss.',
    alt: 'Cache aside read path diagram: the application checks the cache first, returns immediately on a hit in about one millisecond, and on a miss queries the database in about eighty milliseconds then writes the value back into the cache with a time to live.',
    caption: 'A 95% hit rate means only one request in twenty reaches the database — which is how a 5k rps database serves 100k rps of traffic.',
    columns: [
      { label: 'Request', nodes: [{ label: 'App server' }] },
      { label: 'Step 1', nodes: [{ label: 'Cache', sub: 'hit → return, ~1 ms', variant: 'ok' }], edgeLabel: 'read' },
      { label: 'Step 2', nodes: [{ label: 'Database', sub: 'miss → query, ~80 ms', variant: 'warn' }], edgeLabel: 'on miss', dashed: true },
      { label: 'Step 3', nodes: [{ label: 'Write back', sub: 'set key with TTL' }], edgeLabel: 'populate' },
    ],
    annotations: [
      { text: '95% of reads stop here', col: 1, side: 'below' },
      { text: 'only 1 in 20 gets this far', col: 2, side: 'above', dx: 6 },
    ],
  },
  {
    id: 'replication-and-sharding',
    slug: 'database-design-replication-sharding-and-consistency',
    type: 'compare',
    title: 'Replication and sharding solve different problems',
    kicker: 'Replication copies the same data. Sharding splits different data.',
    alt: 'Comparison of replication and sharding. Replication keeps identical copies of the whole dataset on a primary and its replicas, scaling reads and surviving node failure at the cost of replication lag. Sharding splits different rows across independent shards by a partition key, scaling writes and storage but breaking joins and cross-shard transactions.',
    caption: 'Replication scales reads and survives failure. Sharding scales writes and storage. Large systems need both — and sharding is the one that hurts.',
    left: {
      title: 'Replication',
      sub: 'same data, many copies',
      rows: [
        'Primary takes writes; replicas hold identical copies',
        'Scales READS — add replicas, spread queries',
        'Survives node failure: promote a replica',
        'Cost: replication lag, so reads can be stale',
        'Does nothing for write volume or storage size',
      ],
    },
    right: {
      title: 'Sharding',
      sub: 'different data, many nodes',
      rows: [
        'Dataset split by partition key across independent shards',
        'Scales WRITES and total storage',
        'Each shard is a smaller, faster working set',
        'Cost: no cross-shard joins or transactions',
        'Choosing the wrong shard key creates hot spots you cannot undo cheaply',
      ],
    },
    verdict:
      'Reach for replication first — it is nearly free. Shard only when one machine can no longer hold the writes or the data, and say that out loud in the interview.',
  },
  {
    id: 'microservices-topology',
    slug: 'microservices-architecture-building-distributed-systems',
    type: 'flow',
    title: 'Microservices: one gateway, many owners',
    kicker: 'Each service owns its data. No service reaches into another service’s database.',
    alt: 'Microservices diagram showing clients calling an API gateway that routes to a user service, order service and payment service, each owning its own separate database, with an event bus connecting the services asynchronously.',
    caption: 'The rule that makes this work is database-per-service. The moment two services share a table, you have a distributed monolith with none of the benefits.',
    columns: [
      { label: 'Clients', nodes: [{ label: 'Web / Mobile' }] },
      { label: 'Entry', nodes: [{ label: 'API gateway', sub: 'auth, routing, limits', variant: 'accent' }] },
      {
        label: 'Services',
        nodes: [{ label: 'User service' }, { label: 'Order service' }, { label: 'Payment service' }],
        edgeLabel: 'route',
      },
      {
        label: 'Private data',
        nodes: [
          { label: 'Users DB', variant: 'ok' },
          { label: 'Orders DB', variant: 'ok' },
          { label: 'Payments DB', variant: 'ok' },
        ],
        pair: true,
        edgeLabel: 'owns',
      },
    ],
  },
  {
    id: 'consistent-hashing-ring',
    slug: 'consistent-hashing-explained-system-design-interview-guide',
    type: 'ring',
    title: 'The hash ring',
    kicker: 'Keys and servers land on the same circle. A key belongs to the first server clockwise.',
    alt: 'Consistent hashing ring diagram showing four servers positioned around a circular hash space from zero to two to the power thirty-two, with five keys placed on the ring, each key assigned to the first server found moving clockwise. A newly added server takes over only the keys in the arc before it.',
    caption:
      'Add Node E and only the keys in the arc immediately before it move — roughly 1/n of the data. With plain modulo hashing, almost every key would be reassigned.',
    radius: 130,
    nodes: [
      { label: 'Node A', angle: 0 },
      { label: 'Node B', angle: 85 },
      { label: 'Node C', angle: 170 },
      { label: 'Node D', angle: 255 },
      { label: 'Node E (new)', angle: 305, variant: 'new' },
    ],
    keys: [
      { label: 'key1', angle: 30 },
      { label: 'key2', angle: 110 },
      { label: 'key3', angle: 200 },
      { label: 'key4', angle: 275 },
      { label: 'key5', angle: 330 },
    ],
    note: { text: 'only these keys move', angle: 280 },
    legend: [
      { color: 'node', label: 'Server position on the ring (hash of its name)' },
      { color: 'key', label: 'Key position — served by the next server clockwise' },
      { color: 'new', label: 'Newly added server — only steals the arc before it' },
    ],
  },
  {
    id: 'master-slave-replication',
    slug: 'master-slave-replication-database-architecture-explained',
    type: 'flow',
    title: 'Master-slave replication and where lag bites',
    kicker: 'All writes to one node, reads spread across copies that are always slightly behind.',
    alt: 'Master slave replication diagram: the application sends all writes to a single primary database, which asynchronously ships its change log to two read replicas that serve read queries, with replication lag of tens to hundreds of milliseconds meaning a user can read stale data immediately after writing.',
    caption:
      'The classic bug: a user updates their profile, the read hits a replica that has not caught up, and the change appears to vanish. Route read-after-write to the primary.',
    columns: [
      { label: 'Application', nodes: [{ label: 'App servers' }] },
      {
        label: 'Writes',
        nodes: [{ label: 'Primary', sub: 'all INSERT / UPDATE', variant: 'accent' }],
        edgeLabel: 'writes',
      },
      {
        label: 'Reads',
        nodes: [
          { label: 'Replica 1', sub: 'lag ~50 ms' },
          { label: 'Replica 2', sub: 'lag ~120 ms', variant: 'warn' },
        ],
        edgeLabel: 'async replication log',
      },
    ],
    annotations: [
      { text: 'user updates profile → reads the OLD one', col: 2, node: 1, side: 'below' },
    ],
  },

  /* -------------------------------------------------------- case studies */
  {
    id: 'url-shortener-paths',
    slug: 'designing-a-url-shortener-complete-system-design-case-study',
    type: 'flow',
    title: 'URL shortener: write once, read a thousand times',
    kicker: 'The read path is the whole design. Writes are rare and can be slow.',
    alt: 'URL shortener architecture diagram showing the write path where a long URL is sent to the API, converted to a base 62 short code by an ID generator and stored, and the read path where a short code lookup hits the cache first and returns a 301 redirect, falling back to the database on a miss.',
    caption: 'Roughly 100 reads per write. That ratio is why the cache, not the database, is the centre of this design.',
    columns: [
      { label: 'Client', nodes: [{ label: 'Create link' }, { label: 'Follow link' }] },
      { label: 'API', nodes: [{ label: 'Shortener API', variant: 'accent' }] },
      {
        label: 'Logic',
        nodes: [
          { label: 'ID generator', sub: 'counter → base62' },
          { label: 'Cache', sub: 'code → long URL', variant: 'ok' },
        ],
      },
      {
        label: 'Storage',
        nodes: [{ label: 'Key-value store', sub: 'code, url, owner, TTL' }],
        edgeLabel: 'on miss',
      },
    ],
  },
  {
    id: 'social-bookmarking-architecture',
    slug: 'design-a-social-bookmarking-service-delicious-system-design-case-study',
    type: 'flow',
    title: 'Social bookmarking: a read-heavy tagging system',
    kicker: 'Bookmarks are written once and read constantly, by user and by tag.',
    alt: 'Social bookmarking service architecture showing clients hitting a load balancer and application servers, which read from a cache holding hot tag and user timelines, a bookmarks database sharded by user ID, and a separate inverted tag index used to answer tag search queries.',
    caption: 'Two access patterns, two structures: bookmarks sharded by user for timelines, plus an inverted index for tag lookups. One table cannot serve both well.',
    columns: [
      { label: 'Clients', nodes: [{ label: 'Web' }, { label: 'API' }] },
      { label: 'Edge', nodes: [{ label: 'Load balancer', variant: 'accent' }] },
      { label: 'App', nodes: [{ label: 'Bookmark + tag service' }], edgeLabel: 'route' },
      {
        label: 'Data',
        nodes: [
          { label: 'Cache', sub: 'hot timelines', variant: 'ok' },
          { label: 'Bookmarks DB', sub: 'sharded by user' },
          { label: 'Tag index', sub: 'tag → bookmarks' },
        ],
      },
    ],
  },
  {
    id: 'coding-contest-platform',
    slug: 'design-a-coding-contest-platform-leetcode-system-design-interview',
    type: 'flow',
    title: 'Judging submissions without melting the API',
    kicker: 'Code execution is slow and untrusted, so it never happens inline.',
    alt: 'Coding contest platform architecture: a user submits code to the API, which enqueues the submission in a message queue and returns immediately, sandboxed judge workers pull jobs and run test cases, and results are written to a results store that updates a cached leaderboard.',
    caption: 'The queue is the design. It absorbs contest-start spikes, isolates untrusted code in sandboxed workers, and keeps the API responding in milliseconds.',
    columns: [
      { label: 'User', nodes: [{ label: 'Submit code' }] },
      { label: 'API', nodes: [{ label: 'Submission API', sub: 'returns job ID', variant: 'accent' }] },
      { label: 'Buffer', nodes: [{ label: 'Message queue', sub: 'absorbs spikes' }], edgeLabel: 'enqueue' },
      {
        label: 'Execution',
        nodes: [
          { label: 'Judge worker', sub: 'sandboxed' },
          { label: 'Judge worker', sub: 'sandboxed' },
          { label: 'Judge worker', sub: 'sandboxed' },
        ],
        edgeLabel: 'pull',
      },
      {
        label: 'Results',
        nodes: [
          { label: 'Results store' },
          { label: 'Leaderboard', sub: 'cached, sorted set', variant: 'ok' },
        ],
        bus: true,
        edgeLabel: 'verdict',
      },
    ],
    annotations: [
      { text: 'contest starts → 50k submissions in 10s', col: 2, side: 'below' },
    ],
  },
  {
    id: 'news-feed-fanout',
    slug: 'design-facebook-news-feed-system-design-interview-guide',
    type: 'flow',
    title: 'Fan-out on write, with a pull path for celebrities',
    kicker: 'Precompute each user’s feed at post time so reads are a single cache lookup.',
    alt: 'News feed architecture diagram: a user posts, the post service writes to the post store and hands off to a fan-out service, which pushes the post ID into the precomputed feed cache of every follower, while posts from celebrity accounts with millions of followers are skipped and merged in at read time instead.',
    caption: 'The hybrid is the answer interviewers want: push for normal accounts, pull for celebrities. Pure fan-out on write dies on the account with 50 million followers.',
    columns: [
      { label: 'Write', nodes: [{ label: 'User posts' }] },
      { label: 'Ingest', nodes: [{ label: 'Post service', variant: 'accent' }] },
      {
        label: 'Distribute',
        nodes: [
          { label: 'Fan-out service', sub: 'push to followers' },
          { label: 'Celebrity path', sub: 'skip — pull at read', variant: 'warn' },
        ],
        edgeLabel: 'async',
      },
      {
        label: 'Serve',
        nodes: [
          { label: 'Feed cache', sub: 'per-user post IDs', variant: 'ok' },
          { label: 'Post store', sub: 'hydrate content' },
        ],
        pair: true,
      },
    ],
    annotations: [
      { text: '50M followers would melt this', col: 2, node: 1, side: 'below' },
    ],
  },
  {
    id: 'typeahead-architecture',
    slug: 'design-google-typeahead-autocomplete-system-design-interview',
    type: 'flow',
    title: 'Typeahead: precompute the answers, serve from memory',
    kicker: 'Suggestions must return in under 100 ms, so nothing is computed per keystroke.',
    alt: 'Typeahead autocomplete architecture with two paths: an offline path where query logs are aggregated into top phrases and used to build a trie with the top suggestions stored at each node, and an online path where each keystroke hits a suggestion service that reads the in-memory trie shard and returns the cached top five results.',
    caption: 'Every expensive step happens offline. The online path is a prefix walk over an in-memory trie that already knows its top five results.',
    columns: [
      { label: 'Offline', nodes: [{ label: 'Query logs' }, { label: 'Keystroke' }] },
      {
        label: 'Build / route',
        nodes: [
          { label: 'Aggregator', sub: 'count phrases' },
          { label: 'Suggestion API', variant: 'accent' },
        ],
        pair: true,
      },
      {
        label: 'Index',
        nodes: [{ label: 'Trie shards', sub: 'top-k stored per node', variant: 'ok' }],
        edgeLabel: 'prefix walk',
      },
      { label: 'Response', nodes: [{ label: 'Top 5 suggestions', sub: '< 100 ms' }] },
    ],
    annotations: [
      { text: 'all the hard work happens here, offline', col: 1, node: 0, side: 'above', dx: 10 },
    ],
  },

  /* ---------------------------------------------------- process / pillars */
  {
    id: 'system-design-interview-framework',
    slug: 'system-design-interview-framework-step-by-step-2026',
    type: 'steps',
    title: 'The 45-minute system design interview, in six moves',
    kicker: 'Same order every time. The structure is half of what is being scored.',
    alt: 'Six step system design interview framework: clarify requirements for five minutes, estimate scale for five minutes, define the API for five minutes, draw the high level design for ten minutes, deep dive into one or two components for fifteen minutes, and discuss bottlenecks and trade-offs for five minutes.',
    caption: 'Candidates rarely fail on knowledge. They fail by drawing boxes in minute two, before anyone agreed on what the system has to do.',
    steps: [
      { underline: true, note: 'do NOT skip', label: 'Clarify requirements — 5 min', sub: 'Functional and non-functional. Who uses it, what must it do, what can it drop? Write the constraints down where the interviewer can see them.' },
      { label: 'Estimate the scale — 5 min', sub: 'DAU, queries per second, read/write ratio, storage per year. These numbers decide every choice you make later.' },
      { label: 'Define the API — 5 min', sub: 'Three or four endpoints with their parameters. This pins down what the system actually does before any boxes appear.' },
      { label: 'High-level design — 10 min', sub: 'Client, load balancer, service tier, storage. Draw the happy path end to end and narrate the data flow.' },
      { note: 'the real test', label: 'Deep dive — 15 min', sub: 'Let the interviewer pick, or pick the hardest part yourself: sharding, the cache, the fan-out, the queue.' },
      { label: 'Bottlenecks and trade-offs — 5 min', sub: 'Where it breaks at 10x, what you would monitor, what you would do differently with more time.' },
    ],
  },
  {
    id: 'back-of-envelope-estimation',
    slug: 'back-of-the-envelope-estimation-system-design-interview',
    type: 'steps',
    title: 'From daily users to servers, in five multiplications',
    kicker: 'Worked example: a photo-sharing app with 10 million daily active users.',
    alt: 'Five step back of the envelope estimation walkthrough for a photo sharing app: start from ten million daily active users, derive average queries per second of about twelve hundred and peak of about thirty six hundred, calculate about seven hundred and thirty terabytes of new storage per year at two megabytes per photo, derive peak egress of about seven gigabytes per second which is roughly fifty eight gigabits per second, and conclude with about twelve application servers across three availability zones.',
    caption: 'Round aggressively and say the rounding out loud. Nobody is checking your arithmetic — they are checking that your architecture matches your own numbers.',
    steps: [
      { label: '10M daily active users', sub: 'Given, or negotiated with the interviewer. Everything else is derived from this one number.' },
      { label: '~1,200 average QPS, ~3,600 peak', sub: '10M users × 10 actions ÷ 86,400 seconds ≈ 1,200/s. Multiply by 3 for peak. Round 86,400 to 100,000 and do it in your head.' },
      { label: '~730 TB of new storage per year', sub: '10M users × 10% who post × 1 photo × 2 MB ≈ 2 TB/day ≈ 730 TB/year. Replication multiplies it: at 3× you are budgeting for roughly 2 PB.' },
      { note: 'watch the units!', label: '~7 GB/s egress at peak (≈58 Gbps)', sub: '3,600 reads/s × 2 MB ≈ 7 GB/s. Watch the units — GB/s × 8 gives Gbps. This is the number that makes a CDN mandatory, not optional.' },
      { label: '~12 application servers', sub: '3,600 peak QPS ÷ ~1,000 QPS per server ≈ 4. Round up for headroom and spread across three availability zones so losing one zone is survivable.' },
    ],
  },
  {
    id: 'system-design-study-path',
    slug: 'system-design-interview-preparation-complete-guide-2026',
    type: 'steps',
    title: 'A study path that ends in a passed interview',
    kicker: 'Order matters. Case studies before fundamentals is the most common wasted month.',
    alt: 'Five phase system design study path: build fundamentals such as latency, throughput, load balancing and caching in weeks one and two, learn data layer topics including replication, sharding and the CAP theorem in weeks three and four, learn the distributed building blocks of queues, CDNs and rate limiting in week five, work through case studies in weeks six and seven, and finish with mock interviews under time pressure in week eight.',
    caption: 'Eight weeks at a realistic pace. The last phase is the one candidates skip and the one that decides the result.',
    steps: [
      { label: 'Weeks 1–2 · Fundamentals', sub: 'Latency, throughput, horizontal vs vertical scaling, load balancing, caching. Every later topic assumes these.' },
      { label: 'Weeks 3–4 · The data layer', sub: 'Replication, sharding, SQL vs NoSQL, consistency models and the CAP theorem. This is where most interviews are actually won or lost.' },
      { label: 'Week 5 · Distributed building blocks', sub: 'Message queues, CDNs, rate limiting, consistent hashing. The components you assemble case studies from.' },
      { note: 'out loud, timed', label: 'Weeks 6–7 · Case studies', sub: 'URL shortener, news feed, typeahead, chat. Do them start to finish, out loud, on a whiteboard — not by reading solutions.' },
      { underline: true, note: 'everyone skips this', label: 'Week 8 · Mock interviews', sub: 'Full 45 minutes, timed, with someone interrupting you. Fluency under pressure is a separate skill from knowing the material.' },
    ],
  },
  {
    id: 'cap-theorem-triangle',
    slug: 'cap-theorem-explained-system-design-interview',
    type: 'triangle',
    title: 'CAP: partitions are not optional, so you are choosing C or A',
    kicker: 'Networks fail. That makes P a given, and the real question binary.',
    alt: 'CAP theorem triangle with consistency, availability and partition tolerance at the vertices. The CP edge means refusing requests during a partition to keep data correct, as in banking. The AP edge means answering with possibly stale data to stay up, as in social feeds. The CA edge is labelled unavailable in any real distributed system because network partitions cannot be prevented.',
    caption:
      'The honest interview answer: "CA does not exist across a network, so I am choosing CP or AP — and here is which, for this feature, and why."',
    vertices: [
      { label: 'Consistency', sub: 'every read sees the latest write' },
      { label: 'Partition tolerance', sub: 'survives network splits' },
      { label: 'Availability', sub: 'every request gets an answer' },
    ],
    edges: [
      { label: 'CP', sub: 'refuse writes, stay correct' },
      { label: 'AP', sub: 'answer anyway, reconcile later' },
      { label: 'CA', sub: 'single node only — not real', struck: true },
    ],
    note: 'pick one of these two',
  },
  {
    id: 'sql-vs-nosql',
    slug: 'sql-vs-nosql-system-design-interview',
    type: 'compare',
    title: 'SQL vs NoSQL: pick by access pattern, not by fashion',
    kicker: 'The question is what shape your reads are, and whether you need multi-row transactions.',
    alt: 'Comparison of SQL and NoSQL databases. SQL offers a fixed schema, ACID transactions, joins and flexible querying, scaling primarily through read replicas and vertical growth. NoSQL offers a flexible schema, horizontal scaling by partition key, single digit millisecond lookups at scale, but no joins and usually eventual consistency.',
    caption: 'Most systems need both: a relational store for money and identity, a wide-column or document store for the high-volume feed, event or log data.',
    left: {
      title: 'Relational (SQL)',
      sub: 'PostgreSQL, MySQL',
      rows: [
        'Fixed schema — the database enforces your invariants',
        'ACID transactions across multiple rows and tables',
        'Joins let you answer questions you did not plan for',
        'Scales through read replicas; sharding is manual and painful',
        'Right for money, orders, identity, anything with invariants',
      ],
    },
    right: {
      title: 'Non-relational (NoSQL)',
      sub: 'DynamoDB, Cassandra, MongoDB',
      rows: [
        'Flexible schema — fields vary per record, migrations are cheap',
        'Horizontal scaling built in, partitioned by key',
        'Single-digit millisecond lookups at very large scale',
        'No joins — you denormalise and write the data twice',
        'Right for feeds, events, logs, sessions, time-series',
      ],
    },
    verdict:
      'Interview answer: name the access pattern first ("read a user’s last 50 posts by user ID"), then pick the store that serves it in one lookup.',
  },
  {
    id: 'latency-vs-throughput',
    slug: 'latency-vs-throughput-system-design',
    type: 'compare',
    title: 'Latency vs throughput',
    kicker: 'One request’s wait, versus how many requests fit through per second.',
    alt: 'Comparison of latency and throughput. Latency is the time for a single request measured in milliseconds at percentiles p50, p95 and p99, improved by removing hops and caching. Throughput is requests completed per second, improved by adding parallel capacity. Batching raises throughput while worsening latency, showing the two can move in opposite directions.',
    caption: 'They are not the same dial. Batching raises throughput and worsens latency; adding a cache improves both. Always ask which one the requirement is about.',
    left: {
      title: 'Latency',
      sub: 'how long one request takes',
      rows: [
        'Measured in milliseconds, per request',
        'Report p95 and p99, never the average — averages hide the pain',
        'Improved by removing hops: caching, CDNs, fewer round trips',
        'What the user actually feels',
        'Bounded below by physics — light takes ~40 ms to cross the Atlantic',
      ],
    },
    right: {
      title: 'Throughput',
      sub: 'how many requests complete per second',
      rows: [
        'Measured in requests or bytes per second, system-wide',
        'Improved by adding parallel capacity: servers, shards, workers',
        'Capped by the narrowest stage in the pipeline',
        'What capacity planning and cost are about',
        'Batching increases it — while making latency worse',
      ],
    },
    verdict:
      'A system can have excellent throughput and terrible latency at the same time. A queue that clears 50k jobs a second still makes each user wait 30 seconds.',
  },

  /* --------------------------------------------------- new: infra building blocks */
  {
    id: 'cdn-edge-caching',
    slug: 'content-delivery-network-cdn-explained-system-design',
    type: 'flow',
    title: 'A CDN deletes distance, it does not add speed',
    kicker: 'The first request in a region is slow. Every one after it is local.',
    alt: 'CDN diagram showing users in Sydney reaching a nearby edge location, which returns cached assets in about twenty milliseconds on a hit, and on a miss fetches once from the origin server in Mumbai across roughly one hundred and eighty milliseconds before caching the copy for every later request in that region.',
    caption: 'One user pays the full distance penalty; thousands after them do not. This is also why origin traffic collapses — a site doing 50k rps might send 500 to the origin.',
    columns: [
      { label: 'Users', nodes: [{ label: 'Sydney' }, { label: 'London' }] },
      { label: 'Edge (PoP)', nodes: [{ label: 'Nearest edge', sub: 'hit → ~20 ms', variant: 'ok' }], edgeLabel: 'DNS routes' },
      { label: 'Origin', nodes: [{ label: 'Origin server', sub: 'miss → ~180 ms', variant: 'warn' }], edgeLabel: 'on miss only', dashed: true },
    ],
    annotations: [
      { text: '95%+ of requests stop here', col: 1, side: 'below' },
      { text: 'one slow fetch, then never again', col: 2, side: 'below' },
    ],
  },
  {
    id: 'message-queue-decoupling',
    slug: 'message-queues-explained-kafka-rabbitmq-system-design',
    type: 'flow',
    title: 'The queue is what turns 11 seconds into 25 milliseconds',
    kicker: 'Publish the fact, return immediately, let consumers fail on their own time.',
    alt: 'Message queue diagram: a signup API writes the user row and publishes a user created event to a topic, returning in about twenty five milliseconds, while four independent consumers for email, thumbnails, CRM sync and analytics process the event at their own pace, so a CRM outage no longer breaks signup.',
    caption: 'Before the queue, a CRM outage broke signup. After it, the CRM consumer retries alone and nobody notices. That decoupling is the point — the latency win is a bonus.',
    columns: [
      { label: 'Request', nodes: [{ label: 'Signup API', sub: 'writes user row', variant: 'accent' }] },
      { label: 'Event', nodes: [{ label: 'Topic', sub: 'user.created' }], edgeLabel: 'publish' },
      {
        label: 'Consumers',
        nodes: [
          { label: 'Email' },
          { label: 'Thumbnails' },
          { label: 'CRM sync', sub: 'down → retries alone', variant: 'warn' },
          { label: 'Analytics' },
        ],
        edgeLabel: 'each gets a copy',
      },
    ],
    annotations: [
      { text: 'returns in ~25 ms, not 11 s', col: 0, side: 'below' },
    ],
  },
  {
    id: 'rate-limiter-architecture',
    slug: 'design-a-rate-limiter-system-design-interview-guide',
    type: 'flow',
    title: 'Where a rate limiter goes, and why it needs shared state',
    kicker: 'At the door, before anything expensive — counting in one place, not ten.',
    alt: 'Rate limiter architecture: clients call an API gateway that runs a token bucket check against a shared Redis store using an atomic script, allowing requests through to the service when tokens remain and returning HTTP 429 with a Retry-After header when the bucket is empty. In-memory counters on each instance would multiply the limit by the instance count.',
    caption: 'Ten instances each counting locally turns a 100/min limit into 1,000/min. The counter has to live somewhere all of them can see, and the check has to be one atomic operation.',
    columns: [
      { label: 'Clients', nodes: [{ label: 'API clients' }] },
      { label: 'The door', nodes: [{ label: 'API gateway', sub: 'token bucket check', variant: 'accent' }] },
      {
        label: 'Shared state',
        nodes: [{ label: 'Redis', sub: 'atomic incr + TTL', variant: 'ok' }],
        edgeLabel: 'one atomic op',
      },
      {
        label: 'Outcome',
        nodes: [
          { label: 'Service', sub: 'tokens left → allow', variant: 'ok' },
          { label: '429 Too Many', sub: 'empty → Retry-After', variant: 'warn' },
        ],
      },
    ],
    annotations: [
      { text: 'in-memory here = 10x your limit', col: 1, side: 'below' },
    ],
  },
  {
    id: 'index-vs-full-scan',
    slug: 'database-indexing-explained-system-design-interview',
    type: 'compare',
    title: 'Full table scan vs index lookup',
    kicker: 'Same query, same data. The cost curve is what differs.',
    alt: 'Comparison of a full table scan against a B-tree index lookup. The scan reads every row so cost grows linearly with table size, taking about four seconds at ten million rows. The index lookup traverses three or four tree levels so cost grows logarithmically, taking single digit milliseconds at the same size, at the price of extra storage and slower writes.',
    caption: 'The gap widens as you grow, which is why this never shows up in development. At 5,000 rows both are instant; at 10 million one is an incident.',
    left: {
      title: 'Full table scan',
      sub: 'no usable index',
      rows: [
        'Reads every row to answer the query',
        'Cost grows LINEARLY with table size',
        '10M rows ≈ 4 s — and it gets worse every week',
        'Nothing to maintain, no extra storage',
        'Fine for small tables and one-off analytics',
      ],
    },
    right: {
      title: 'B-tree index lookup',
      sub: 'index on the filtered column',
      rows: [
        'Traverses 3–4 levels, then reads matching rows',
        'Cost grows LOGARITHMICALLY with table size',
        '10M rows ≈ single-digit milliseconds',
        'Serves equality, ranges and ORDER BY from one structure',
        'Costs storage, and slows every INSERT, UPDATE and DELETE',
      ],
    },
    verdict:
      'The trap is concluding "index everything". Eight indexes turn one insert into nine writes — index for the queries you actually run, then confirm with EXPLAIN.',
  },
];

export const BY_SLUG = new Map(SPECS.map((s) => [s.slug, s]));
