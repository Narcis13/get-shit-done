# Revolutionary Workflow Engine: Deep Analysis & Design

## Executive Summary

A **text-native workflow engine** that treats markdown files as executable programs. Unlike n8n's visual graphs, this system uses semantic YAML, XML, and code blocks to define automations that can be:
- Version controlled
- Reviewed in PRs
- AI-augmented at any step
- Composed from smaller workflows
- Executed deterministically OR with AI reasoning

---

## Part 1: Analysis of Current LPL Patterns

### What Works Well

| Pattern | Strength | Example |
|---------|----------|---------|
| **YAML Frontmatter** | Metadata that tools can parse | `status: testing`, `wave: 2` |
| **Semantic XML Tags** | Self-documenting structure | `<step>`, `<purpose>`, `<success_criteria>` |
| **Bash Blocks** | Deterministic operations | State reads, file checks |
| **State Files** | Persistence across context resets | STATE.md, LOOP-STATE.md |
| **Task Spawning** | Fresh context for heavy work | `Task(subagent_type="...")` |
| **Routing Tables** | Clear conditional logic | `| Status | Action |` |

### What's Missing for General Automation

1. **No Data Schema** - Steps pass data implicitly
2. **No External Integrations** - Assumes local filesystem
3. **No Event Triggers** - All workflows are manually invoked
4. **No Parallel Data Processing** - Only parallel agent spawning
5. **No Time-Based Operations** - No schedules, delays, debounce
6. **No Error Recovery Patterns** - Ad-hoc failure handling

---

## Part 2: Revolutionary Concepts

### Concept 1: **Reactive Data Streams**

Instead of "step 1 → step 2 → step 3", data FLOWS through the workflow:

```yaml
---
name: x-to-newsletter
trigger: schedule("0 9 * * MON")  # Every Monday 9am
---
```

```xml
<flow>
  <source id="trending" type="api">
    url: https://api.x.com/trends
    auth: $secrets.X_API_KEY
    output: { topics: Topic[] }
  </source>

  <transform id="enrich" input="trending.topics">
    <parallel foreach="topic">
      <ai model="sonnet" prompt="Research this topic: {{topic.name}}">
        <output>{ summary: string, sentiment: float, key_tweets: Tweet[] }</output>
      </ai>
    </parallel>
  </transform>

  <merge id="combine" inputs="enrich[]">
    strategy: concat
  </merge>

  <sink id="newsletter" type="email">
    to: $env.SUBSCRIBER_LIST
    template: @templates/weekly-digest.md
    data: combine.output
  </sink>
</flow>
```

**Key Innovation:** Data types flow through, enabling:
- Static analysis ("will this workflow run?")
- Auto-complete in editors
- Runtime validation

---

### Concept 2: **Typed Nodes with Schemas**

Every node declares its interface:

```xml
<node id="sentiment-analyzer" version="1.2.0">
  <meta>
    author: claude
    category: nlp
    description: Analyzes text sentiment using AI
  </meta>

  <input>
    <field name="text" type="string" required="true"/>
    <field name="language" type="enum[en,es,fr,de]" default="en"/>
    <field name="granularity" type="enum[document,sentence]" default="document"/>
  </input>

  <output>
    <field name="score" type="float" range="[-1,1]"/>
    <field name="label" type="enum[positive,negative,neutral]"/>
    <field name="confidence" type="float" range="[0,1]"/>
    <field name="breakdown" type="SentimentDetail[]" when="granularity=sentence"/>
  </output>

  <implementation>
    <ai model="haiku">
      Analyze sentiment of: {{input.text}}

      Return JSON: { score, label, confidence }
    </ai>
  </implementation>
</node>
```

---

### Concept 3: **Branching & Merging with Pattern Matching**

Not just if/else, but full pattern matching:

```xml
<branch id="route-content" input="classified">
  <match pattern="{ type: 'breaking_news', urgency: > 0.8 }">
    <goto flow="urgent-alert"/>
  </match>

  <match pattern="{ type: 'evergreen', sentiment: 'positive' }">
    <goto flow="schedule-later" delay="P2D"/>  <!-- 2 days -->
  </match>

  <match pattern="{ topics: [*, 'technology', *] }">
    <goto node="tech-specialist"/>
  </match>

  <otherwise>
    <goto node="general-queue"/>
  </otherwise>
</branch>
```

---

### Concept 4: **Temporal Primitives**

Built-in time operations:

```xml
<flow name="rate-limited-scraper">
  <source id="urls" type="list">
    items: @data/urls-to-scrape.txt
  </source>

  <!-- Throttle: max 10 per minute -->
  <throttle id="rate-limit" input="urls" rate="10/1m"/>

  <transform id="fetch" input="rate-limit">
    <http method="GET" url="{{item}}"/>

    <!-- Retry with exponential backoff -->
    <retry max="3" backoff="exponential" base="1s"/>
  </transform>

  <!-- Batch: collect for 5 minutes OR 100 items -->
  <batch id="collect" input="fetch"
         window="5m"
         max-size="100"
         flush-on="either"/>

  <!-- Debounce: wait for quiet period -->
  <debounce id="settle" input="collect" quiet="30s"/>
</flow>
```

---

### Concept 5: **AI Reasoning as Control Flow**

AI doesn't just process data—it makes routing decisions:

```xml
<decision id="should-publish" input="draft">
  <ai model="opus" role="editor">
    <context>
      You are the editor of a tech newsletter.
      You receive drafts and decide if they're ready.
    </context>

    <prompt>
      Review this draft newsletter:

      {{draft.content}}

      Decide:
      - PUBLISH: Ready to send
      - REVISE: Needs work (explain what)
      - REJECT: Not suitable (explain why)
    </prompt>

    <routes>
      <when output="PUBLISH">
        <goto node="send-newsletter"/>
      </when>
      <when output="REVISE">
        <goto node="revision-loop" with="ai.feedback"/>
      </when>
      <when output="REJECT">
        <goto node="archive" with="ai.reason"/>
      </when>
    </routes>
  </ai>
</decision>
```

---

### Concept 6: **Workflow Composition**

Workflows can include other workflows:

```xml
<workflow name="full-content-pipeline">
  <include src="@workflows/gather-sources.md" as="gather">
    <bind input.sources="$config.content_sources"/>
    <bind input.since="now() - P7D"/>
  </include>

  <include src="@workflows/ai-summarize.md" as="summarize">
    <bind input.items="gather.output"/>
    <bind input.style="$config.writing_style"/>
  </include>

  <include src="@workflows/publish-multiplatform.md" as="publish">
    <bind input.content="summarize.output"/>
    <bind input.platforms="['email', 'twitter', 'linkedin']"/>
  </include>
</workflow>
```

---

### Concept 7: **Live State in the File**

The workflow file itself shows current state:

```yaml
---
name: weekly-newsletter
status: running
current: enrich-content
started: 2025-02-01T09:00:00Z
progress: 3/7 nodes
---
```

```xml
<flow>
  <source id="gather" status="complete" took="12.3s">
    output_count: 47 items
  </source>

  <transform id="filter" status="complete" took="0.8s">
    filtered: 12 items (25% kept)
  </transform>

  <transform id="enrich" status="running" progress="23/35">
    <!-- CURRENT: Processing item 24 -->
    current: "Tech startup raises $50M"
    eta: ~2 minutes
  </transform>

  <transform id="compose" status="pending"/>

  <sink id="send" status="pending"/>
</flow>

<!--
## Execution Log

| Time | Node | Event |
|------|------|-------|
| 09:00:00 | gather | Started |
| 09:00:12 | gather | Complete (47 items) |
| 09:00:13 | filter | Started |
| 09:00:13 | filter | Complete (12 items) |
| 09:00:14 | enrich | Started |
| 09:02:37 | enrich | Progress: 23/35 |
-->
```

---

### Concept 8: **Error Recovery Patterns**

Declarative error handling:

```xml
<node id="external-api" type="http">
  <request>
    method: POST
    url: https://api.external.com/process
    body: {{input.data}}
  </request>

  <on-error>
    <!-- Retry pattern -->
    <retry when="status IN [429, 503]" max="5" backoff="exponential"/>

    <!-- Fallback pattern -->
    <fallback when="status = 500">
      <goto node="backup-api"/>
    </fallback>

    <!-- Circuit breaker pattern -->
    <circuit-breaker threshold="5" window="1m" cooldown="5m">
      <on-open>
        <goto node="degraded-mode"/>
      </on-open>
    </circuit-breaker>

    <!-- Dead letter queue -->
    <dlq when="retries-exhausted">
      <sink type="file" path="@logs/failed-{{timestamp}}.json"/>
      <alert channel="slack" message="API failure: {{error}}"/>
    </dlq>
  </on-error>
</node>
```

---

### Concept 9: **Context Hierarchy**

Context flows through and can be scoped:

```xml
<workflow>
  <context id="global">
    timezone: UTC
    log_level: info
    secrets: $vault/production
  </context>

  <flow name="main">
    <context inherit="global">
      <!-- Override for this flow -->
      log_level: debug
      <!-- Add flow-specific -->
      batch_size: 100
    </context>

    <branch id="by-region">
      <match pattern="region = 'EU'">
        <context>
          <!-- GDPR-specific settings -->
          data_retention: P30D
          anonymize_pii: true
        </context>
        <goto flow="eu-processing"/>
      </match>
    </branch>
  </flow>
</workflow>
```

---

### Concept 10: **Multi-Modal Processing**

Handle text, images, audio, video:

```xml
<node id="content-analyzer" type="multi-modal">
  <input>
    <field name="content" type="union[string, image, audio, video]"/>
  </input>

  <dispatch on="typeof(content)">
    <when type="string">
      <ai model="sonnet" task="text-analysis"/>
    </when>
    <when type="image">
      <ai model="sonnet" task="vision">
        Describe this image and extract any text.
      </ai>
    </when>
    <when type="audio">
      <transcribe engine="whisper"/>
      <then>
        <ai model="sonnet" task="text-analysis"/>
      </then>
    </when>
    <when type="video">
      <extract-frames interval="10s"/>
      <parallel foreach="frame">
        <ai model="haiku" task="vision"/>
      </parallel>
      <merge strategy="timeline"/>
    </when>
  </dispatch>

  <output>
    <field name="summary" type="string"/>
    <field name="entities" type="Entity[]"/>
    <field name="sentiment" type="Sentiment"/>
  </output>
</node>
```

---

## Part 3: Complete Example Workflow

### Use Case: "Analyze X Trends → Compose Newsletter"

```yaml
---
name: x-trends-to-newsletter
version: 1.0.0
description: |
  Analyzes trending topics on X, researches each,
  composes a weekly newsletter, and sends to subscribers.

trigger:
  schedule: "0 9 * * MON"  # Every Monday 9am
  manual: true              # Also allow manual runs

config:
  topic_count: 10
  research_depth: medium    # quick | medium | deep
  newsletter_style: conversational

secrets:
  - X_API_KEY
  - OPENAI_API_KEY
  - SENDGRID_API_KEY

outputs:
  newsletter_url: string
  sent_to: number
  open_rate: number  # Available after 24h
---
```

```xml
<workflow>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 1: DATA GATHERING                                     -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="gather" description="Collect trending topics from X">

  <source id="fetch-trends" type="http">
    <request>
      method: GET
      url: https://api.x.com/2/trends/place
      headers:
        Authorization: Bearer $secrets.X_API_KEY
      params:
        id: 1  # Worldwide
    </request>

    <transform>
      <!-- Extract and normalize -->
      response.trends
        .slice(0, $config.topic_count)
        .map(t => ({
          name: t.name,
          tweet_volume: t.tweet_volume || 0,
          url: t.url
        }))
    </transform>

    <output type="Topic[]">
      <schema>
        name: string
        tweet_volume: number
        url: string
      </schema>
    </output>

    <on-error>
      <retry when="status IN [429, 503]" max="3" backoff="exponential"/>
      <fallback when="status = 401">
        <alert channel="slack" message="X API key expired!"/>
        <fail reason="Authentication failed"/>
      </fallback>
    </on-error>
  </source>

  <log level="info">
    Fetched {{fetch-trends.output.length}} trending topics
  </log>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 2: RESEARCH & ENRICHMENT                              -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="research" description="Deep research on each topic">

  <parallel id="research-topics" input="gather.fetch-trends.output">
    <foreach item="topic" max-concurrency="5">

      <ai id="research" model="sonnet">
        <context>
          You are a research analyst preparing content for a tech newsletter.
          Research depth: {{$config.research_depth}}
        </context>

        <prompt>
          Research the trending topic: "{{topic.name}}"

          1. What is this about?
          2. Why is it trending now?
          3. Key facts and figures
          4. Multiple perspectives on this
          5. What should readers know?

          Format as structured JSON.
        </prompt>

        <output type="Research">
          <schema>
            topic: string
            summary: string
            why_trending: string
            key_facts: string[]
            perspectives: { viewpoint: string, argument: string }[]
            reader_takeaway: string
            sources: string[]
          </schema>
        </output>

        <validate>
          <!-- Ensure quality -->
          output.summary.length > 100
          output.key_facts.length >= 3
        </validate>
      </ai>

      <ai id="sentiment" model="haiku">
        <prompt>
          Analyze sentiment around "{{topic.name}}" based on:
          {{research.output.perspectives}}

          Return: { overall: positive|negative|neutral|mixed, score: -1 to 1 }
        </prompt>
      </ai>

      <merge id="enriched-topic">
        <output>
          {
            ...topic,
            research: research.output,
            sentiment: sentiment.output
          }
        </output>
      </merge>

    </foreach>
  </parallel>

  <checkpoint id="review-research" type="optional">
    <condition>$config.research_depth = 'deep'</condition>
    <prompt>
      Research complete for {{research-topics.output.length}} topics.
      Review before composing newsletter?
    </prompt>
    <actions>
      <action id="approve" label="Looks good, continue"/>
      <action id="edit" label="Let me adjust">
        <goto node="manual-edit-research"/>
      </action>
    </actions>
  </checkpoint>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 3: CONTENT COMPOSITION                                -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="compose" description="Write the newsletter">

  <ai id="rank-topics" model="sonnet">
    <prompt>
      Rank these topics for a newsletter, considering:
      - Reader interest (tech audience)
      - Information value
      - Sentiment variety

      Topics: {{research.research-topics.output}}

      Return ordered array of topic names.
    </prompt>
  </ai>

  <ai id="draft-newsletter" model="opus">
    <context>
      You are writing a newsletter in this style: {{$config.newsletter_style}}

      Newsletter sections:
      1. Opening hook (2-3 sentences)
      2. Top Stories (3 topics, detailed)
      3. Quick Hits (remaining topics, brief)
      4. Closing thought
    </context>

    <prompt>
      Write this week's newsletter using these ranked topics:

      {{rank-topics.output.map(name =>
        research.research-topics.output.find(t => t.topic === name)
      )}}

      Make it engaging, informative, and on-brand.
    </prompt>

    <output type="Newsletter">
      <schema>
        subject_line: string
        preview_text: string
        html_content: string
        plain_text: string
        word_count: number
      </schema>
    </output>
  </ai>

  <loop id="revision-loop" max="3">
    <ai id="self-review" model="opus">
      <prompt>
        Review this newsletter draft critically:

        {{draft-newsletter.output.html_content}}

        Check for:
        - Factual accuracy
        - Engaging writing
        - Proper structure
        - Call to action

        Decision: APPROVE or REVISE with specific feedback
      </prompt>

      <routes>
        <when output="APPROVE">
          <break-loop/>
        </when>
        <when output="REVISE">
          <ai id="revise" model="opus" inherit-context="draft-newsletter">
            <prompt>
              Revise the newsletter based on this feedback:
              {{self-review.output.feedback}}
            </prompt>
          </ai>
          <continue-loop with="revise.output"/>
        </when>
      </routes>
    </ai>
  </loop>

  <checkpoint id="human-approval" type="required">
    <prompt>
      Newsletter draft ready for review.

      Subject: {{draft-newsletter.output.subject_line}}
      Word count: {{draft-newsletter.output.word_count}}

      [Preview available at staging URL]
    </prompt>
    <actions>
      <action id="approve" label="Send it!"/>
      <action id="edit" label="I'll edit manually">
        <input type="text" placeholder="Or paste your edits here..."/>
      </action>
      <action id="abort" label="Cancel this week"/>
    </actions>
    <routes>
      <when action="approve"><goto phase="deliver"/></when>
      <when action="edit"><goto node="apply-human-edits"/></when>
      <when action="abort"><goto node="archive-draft"/></when>
    </routes>
  </checkpoint>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 4: DELIVERY                                           -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="deliver" description="Send to subscribers">

  <source id="get-subscribers" type="database">
    query: SELECT email, name, preferences FROM subscribers WHERE active = true
    connection: $secrets.DATABASE_URL
  </source>

  <transform id="personalize" input="get-subscribers.output">
    <parallel foreach="subscriber" max-concurrency="10">
      <template>
        <input>
          newsletter: compose.draft-newsletter.output
          subscriber: {{subscriber}}
        </input>
        <output>
          {
            to: subscriber.email,
            subject: newsletter.subject_line,
            html: newsletter.html_content.replace(
              '{{name}}',
              subscriber.name || 'Reader'
            ),
            metadata: { subscriber_id: subscriber.id }
          }
        </output>
      </template>
    </parallel>
  </transform>

  <sink id="send-emails" type="sendgrid" input="personalize.output">
    <config>
      api_key: $secrets.SENDGRID_API_KEY
      from: newsletter@example.com
      from_name: Tech Weekly
      tracking: true
    </config>

    <batch size="100" delay="1s"/>

    <on-error>
      <retry when="status = 429" max="5" backoff="exponential"/>
      <dlq when="status IN [400, 401]">
        <log level="error">Failed to send to {{item.to}}: {{error}}</log>
      </dlq>
    </on-error>
  </sink>

  <sink id="archive" type="file">
    path: @archive/newsletters/{{date('YYYY-MM-DD')}}.md
    content: |
      # {{compose.draft-newsletter.output.subject_line}}

      Sent: {{now()}}
      Recipients: {{send-emails.success_count}}

      ---

      {{compose.draft-newsletter.output.html_content}}
  </sink>

  <output>
    newsletter_url: archive.path
    sent_to: send-emails.success_count
    failed: send-emails.failure_count
  </output>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- ERROR BOUNDARIES                                            -->
<!-- ═══════════════════════════════════════════════════════════ -->

<on-workflow-error>
  <alert channel="slack" webhook="$secrets.SLACK_WEBHOOK">
    Workflow failed at {{current_node}}
    Error: {{error.message}}

    Logs: {{workflow.log_url}}
  </alert>

  <snapshot path="@debug/{{workflow.run_id}}.json">
    <!-- Save full state for debugging -->
    include: [state, context, errors]
  </snapshot>
</on-workflow-error>

</workflow>
```

---

## Part 4: Node Library Architecture

### Built-in Node Categories

```
nodes/
├── sources/           # Data input
│   ├── http.md        # REST APIs
│   ├── websocket.md   # Real-time streams
│   ├── database.md    # SQL/NoSQL queries
│   ├── file.md        # Local/S3/GCS files
│   ├── rss.md         # RSS/Atom feeds
│   ├── webhook.md     # Incoming webhooks
│   └── schedule.md    # Cron triggers
│
├── transforms/        # Data processing
│   ├── map.md         # Transform each item
│   ├── filter.md      # Filter by condition
│   ├── reduce.md      # Aggregate
│   ├── sort.md        # Order items
│   ├── group.md       # Group by key
│   ├── flatten.md     # Flatten nested
│   ├── dedupe.md      # Remove duplicates
│   └── template.md    # String templates
│
├── ai/                # AI operations
│   ├── complete.md    # Text completion
│   ├── classify.md    # Classification
│   ├── extract.md     # Structured extraction
│   ├── summarize.md   # Summarization
│   ├── translate.md   # Translation
│   ├── sentiment.md   # Sentiment analysis
│   ├── vision.md      # Image analysis
│   └── embedding.md   # Vector embeddings
│
├── control/           # Flow control
│   ├── branch.md      # Conditional routing
│   ├── loop.md        # Iteration
│   ├── parallel.md    # Concurrent execution
│   ├── merge.md       # Combine streams
│   ├── checkpoint.md  # Human approval
│   └── gate.md        # Conditional pass
│
├── time/              # Temporal operations
│   ├── delay.md       # Wait
│   ├── throttle.md    # Rate limit
│   ├── debounce.md    # Wait for quiet
│   ├── batch.md       # Collect over time
│   ├── timeout.md     # Time limit
│   └── schedule.md    # Cron scheduling
│
├── sinks/             # Data output
│   ├── http.md        # REST APIs
│   ├── email.md       # SMTP/SendGrid/etc
│   ├── slack.md       # Slack messages
│   ├── database.md    # Insert/Update
│   ├── file.md        # Write files
│   └── webhook.md     # Outgoing webhooks
│
└── utility/           # Helpers
    ├── log.md         # Logging
    ├── alert.md       # Notifications
    ├── cache.md       # Caching
    └── secret.md      # Secret retrieval
```

### Custom Node Definition

```xml
<!-- nodes/custom/x-scraper.md -->
---
name: x-scraper
version: 1.0.0
author: yourname
category: sources
description: Scrapes tweets matching a query

dependencies:
  - puppeteer: ^21.0.0

config:
  X_COOKIES: "Authentication cookies for X"
---

<node>
  <input>
    <field name="query" type="string" required="true"/>
    <field name="limit" type="number" default="100"/>
    <field name="since" type="datetime" optional="true"/>
  </input>

  <output type="Tweet[]">
    <schema>
      id: string
      text: string
      author: { name: string, handle: string }
      timestamp: datetime
      metrics: { likes: number, retweets: number }
    </schema>
  </output>

  <implementation lang="javascript">
    const puppeteer = require('puppeteer');

    module.exports = async ({ input, config, context }) => {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      // Set cookies from config
      await page.setCookie(...JSON.parse(config.X_COOKIES));

      // Navigate and scrape
      await page.goto(`https://x.com/search?q=${encodeURIComponent(input.query)}`);

      const tweets = await page.evaluate(() => {
        // ... scraping logic
      });

      await browser.close();

      return tweets.slice(0, input.limit);
    };
  </implementation>

  <tests>
    <test name="basic-search">
      <input>
        query: "AI news"
        limit: 10
      </input>
      <assert>
        output.length <= 10
        output.every(t => t.id && t.text)
      </assert>
    </test>
  </tests>
</node>
```

---

## Part 5: Runtime Architecture

### Execution Engine

```
┌─────────────────────────────────────────────────────────────┐
│                     WORKFLOW ENGINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   PARSER    │───>│  VALIDATOR  │───>│  SCHEDULER  │     │
│  │             │    │             │    │             │     │
│  │ MD → AST    │    │ Type check  │    │ DAG build   │     │
│  │ YAML parse  │    │ Schema      │    │ Wave calc   │     │
│  │ XML parse   │    │ Dependency  │    │ Parallelism │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    EXECUTOR                          │   │
│  │                                                      │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │ Node    │  │ Context │  │ State   │  │ Event  │  │   │
│  │  │ Runner  │  │ Manager │  │ Store   │  │ Bus    │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  │                                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │              NODE RUNTIMES                   │    │   │
│  │  │                                              │    │   │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │    │   │
│  │  │  │ AI  │ │HTTP │ │ DB  │ │File │ │Custom│   │    │   │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  OBSERVABILITY                       │   │
│  │                                                      │   │
│  │  Logs │ Traces │ Metrics │ State Snapshots │ Alerts │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Execution Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Immediate** | Run now, wait for completion | CLI invocation, testing |
| **Scheduled** | Run on cron schedule | Regular automations |
| **Event-Driven** | Run on trigger | Webhooks, file changes |
| **Streaming** | Continuous processing | Real-time pipelines |
| **Dry-Run** | Validate without executing | Testing, debugging |

---

## Part 6: Differentiators from n8n/Zapier

| Aspect | n8n/Zapier | This System |
|--------|------------|-------------|
| **Definition** | Visual graph (JSON blob) | Human-readable markdown |
| **Version Control** | Difficult | Native git workflow |
| **Code Review** | Can't review visual | PR reviews possible |
| **AI Integration** | Bolt-on | First-class citizen |
| **Type Safety** | None | Schema-based validation |
| **Composition** | Copy-paste | Import & extend |
| **Debugging** | Visual debugger | Log files + state snapshots |
| **Customization** | Limited nodes | MD-based custom nodes |
| **Context** | Per-node | Hierarchical inheritance |
| **Testing** | Manual | Declarative test cases |

---

## Part 7: Implementation Roadmap

### Phase 1: Core Engine (MVP)
- [ ] MD parser for workflow files
- [ ] Basic node types: source, transform, sink
- [ ] Sequential execution
- [ ] State persistence
- [ ] CLI interface

### Phase 2: AI Integration
- [ ] AI node type with model selection
- [ ] Structured output validation
- [ ] Prompt templates with placeholders
- [ ] AI-based routing decisions

### Phase 3: Advanced Flow Control
- [ ] Parallel execution
- [ ] Branching with pattern matching
- [ ] Loops with break conditions
- [ ] Error recovery patterns

### Phase 4: Temporal Features
- [ ] Scheduled triggers
- [ ] Throttle/debounce/batch
- [ ] Timeouts and delays
- [ ] Window-based aggregation

### Phase 5: Ecosystem
- [ ] Node package registry
- [ ] Workflow sharing/templates
- [ ] Visual preview (read-only)
- [ ] IDE extensions

---

## Appendix A: Full Syntax Reference

### Frontmatter Schema

```yaml
---
# Required
name: string                    # Unique workflow identifier
version: semver                 # Semantic version

# Optional metadata
description: string             # Human description
author: string                  # Author name/email
tags: string[]                  # Categorization
license: string                 # License identifier

# Triggers
trigger:
  schedule: cron-expression     # When to run
  webhook: path                 # Incoming webhook path
  event: event-name             # Event trigger
  manual: boolean               # Allow manual runs

# Configuration
config:
  key: value                    # User-configurable settings

# Secrets (names only, values from vault)
secrets:
  - SECRET_NAME                 # Required secrets

# Input schema (for composable workflows)
input:
  field_name:
    type: string|number|boolean|array|object
    required: boolean
    default: value

# Output schema
output:
  field_name:
    type: string|number|boolean|array|object

# Runtime settings
runtime:
  timeout: duration             # Max execution time
  retry: number                 # Default retry count
  concurrency: number           # Max parallel nodes
---
```

### XML Tag Reference

| Tag | Purpose | Attributes |
|-----|---------|------------|
| `<workflow>` | Root container | name, version |
| `<phase>` | Logical grouping | name, description |
| `<flow>` | Data flow definition | name |
| `<source>` | Data input | id, type |
| `<transform>` | Data processing | id, input |
| `<sink>` | Data output | id, type, input |
| `<ai>` | AI operation | id, model, role |
| `<branch>` | Conditional routing | id, input |
| `<match>` | Pattern matching | pattern |
| `<parallel>` | Concurrent execution | id, input |
| `<foreach>` | Iteration | item, max-concurrency |
| `<loop>` | Repeated execution | id, max |
| `<checkpoint>` | Human approval | id, type |
| `<merge>` | Combine streams | id, inputs, strategy |
| `<context>` | Scoped variables | id, inherit |
| `<on-error>` | Error handling | - |
| `<retry>` | Retry policy | when, max, backoff |
| `<fallback>` | Fallback action | when |
| `<output>` | Node output schema | type |
| `<input>` | Node input definition | - |
| `<field>` | Schema field | name, type, required, default |

---

## Appendix B: Expression Language

### Variable References

```
$config.key           # Config value
$secrets.NAME         # Secret value
$env.VAR              # Environment variable
$context.key          # Current context value
$input.field          # Workflow input
$output.field         # Current node output

node_id.output        # Reference node output
phase.node.output     # Cross-phase reference
```

### Built-in Functions

```
# Time
now()                 # Current timestamp
date(format)          # Format current date
duration(spec)        # Parse duration (e.g., "P1D")

# String
upper(s)              # Uppercase
lower(s)              # Lowercase
trim(s)               # Trim whitespace
replace(s, old, new)  # Replace substring
split(s, delim)       # Split to array
join(arr, delim)      # Join array

# Array
length(arr)           # Array length
first(arr)            # First element
last(arr)             # Last element
slice(arr, start, end)# Slice array
filter(arr, pred)     # Filter elements
map(arr, fn)          # Transform elements
reduce(arr, fn, init) # Aggregate

# Math
min(a, b)             # Minimum
max(a, b)             # Maximum
sum(arr)              # Sum array
avg(arr)              # Average
round(n, decimals)    # Round number

# JSON
parse(s)              # Parse JSON string
stringify(obj)        # Serialize to JSON
get(obj, path)        # Get nested value
set(obj, path, val)   # Set nested value
```

---

This design creates a **text-native automation system** where:
1. Workflows are code — reviewable, versionable, composable
2. AI is native — not an afterthought but woven into the fabric
3. Types matter — catch errors before runtime
4. State is visible — the file itself shows progress
5. Extensibility is trivial — custom nodes are just markdown files
