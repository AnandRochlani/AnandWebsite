import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '@/components/SEOHead';

const terms = [
  ['Availability', 'The percentage of time a system can successfully serve requests.'],
  ['Cache', 'Fast temporary storage that reduces latency and database load but introduces invalidation and staleness trade-offs.'],
  ['CAP theorem', 'During a network partition, a distributed system must choose between consistency and availability.'],
  ['CDN', 'A distributed network that serves cached content close to users.'],
  ['Consistency', 'The guarantee that clients observe data according to a defined ordering or freshness model.'],
  ['Consistent hashing', 'A partitioning method where membership changes move only a small share of keys.'],
  ['Database index', 'A structure that speeds reads at the cost of storage and additional write work.'],
  ['Eventual consistency', 'A model where replicas may temporarily disagree but converge later.'],
  ['Horizontal scaling', 'Adding machines or service instances to increase capacity and resilience.'],
  ['Idempotency', 'Repeating an operation produces the same final effect as performing it once.'],
  ['Latency', 'The time required to complete one operation, often measured at a percentile.'],
  ['Load balancer', 'A component that distributes requests across healthy service instances.'],
  ['Message queue', 'A durable buffer that decouples producers and consumers and enables asynchronous work.'],
  ['Partition key', 'The value used to decide which shard stores a record.'],
  ['Replication', 'Maintaining multiple copies of data for availability, read scale, or recovery.'],
  ['Sharding', 'Splitting a dataset across independent partitions.'],
  ['SLA', 'A reliability commitment measured through service-level indicators and objectives.'],
  ['Throughput', 'The amount of work completed per unit of time.'],
  ['Vertical scaling', 'Increasing the capacity of one machine.'],
  ['Write-ahead log', 'An append-only change record written before database pages are updated.'],
];

const SystemDesignGlossaryPage = () => (
  <>
    <SEOHead
      title="System Design Glossary: 20 Essential Terms"
      description="A concise System Design glossary covering caching, sharding, replication, consistency, queues, latency, throughput, and interview terminology."
      canonical="https://anandrochlani.com/system-design-glossary"
      keywords="system design glossary, distributed systems terms, system design terminology"
    />
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-brand">Reference</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">System Design Glossary</h1>
        <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-600">Twenty terms you should be able to define, compare, and apply during a System Design interview.</p>
        <dl className="mt-12 grid gap-5 md:grid-cols-2">
          {terms.map(([term, definition]) => (
            <div key={term} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <dt className="text-xl font-bold text-slate-900">{term}</dt>
              <dd className="mt-2 leading-7 text-slate-600">{definition}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-12 rounded-2xl border border-brand/20 bg-brand-soft p-7">
          <h2 className="text-2xl font-bold text-slate-900">Turn definitions into decisions</h2>
          <p className="mt-3 text-slate-600">Use the complete learning path to see when each concept belongs in an architecture and which trade-off it introduces.</p>
          <Link to="/blog/system-design-interview-preparation-complete-guide-2026" className="mt-5 inline-block font-semibold text-brand">Follow the System Design interview roadmap →</Link>
        </div>
      </section>
    </div>
  </>
);

export default SystemDesignGlossaryPage;
