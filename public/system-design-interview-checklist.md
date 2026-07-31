# System Design Interview Checklist

Use this checklist during practice. In an interview, say the decisions aloud rather than silently checking boxes.

## Clarify the problem

- [ ] Identify the three essential user actions.
- [ ] Separate must-have features from optional features.
- [ ] Ask for daily active users and geographic scope.
- [ ] Confirm latency, availability, durability, and consistency expectations.
- [ ] State the final scope in one sentence.

## Estimate what changes the design

- [ ] Calculate average and peak read and write QPS.
- [ ] Estimate object size and annual storage growth.
- [ ] Estimate bandwidth for images, video, or large payloads.
- [ ] Finish each estimate with its architecture consequence.

## Define the interface and data

- [ ] Write the main APIs.
- [ ] Mention authentication, pagination, idempotency, and rate limits.
- [ ] Identify core entities and access patterns.
- [ ] Choose SQL or NoSQL based on requirements.
- [ ] Choose a partition key and consider hot keys.

## Draw and explain the architecture

- [ ] Walk through the read path and write path.
- [ ] Explain load balancing and horizontal scaling.
- [ ] Decide where caching helps and how stale data is handled.
- [ ] Use queues for asynchronous work.
- [ ] Store large blobs outside the primary database and use a CDN.

## Deep-dive and close

- [ ] Identify the first likely bottleneck.
- [ ] Explain replication, failover, and replication lag.
- [ ] Handle retries, duplicate work, and partial failures.
- [ ] Discuss latency, errors, saturation, queue lag, and cache hit rate.
- [ ] Summarize the design and its biggest trade-off.

Free learning path: https://anandrochlani.com/blog/system-design-interview-preparation-complete-guide-2026

Course: https://www.udemy.com/course/system-design-fundamental/?referralCode=4D123B9F202E6D906A73
