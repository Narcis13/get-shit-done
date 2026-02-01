# FlowScript: Text-Native Workflow Specification

**Version:** 0.1.0-draft
**Status:** RFC

---

## 1. File Format

A FlowScript workflow is a single `.flow.md` file with three sections:

```
┌────────────────────────────────────┐
│  YAML Frontmatter (---)            │  ← Metadata, config, triggers
├────────────────────────────────────┤
│  XML Body (<workflow>)             │  ← Execution logic
├────────────────────────────────────┤
│  Markdown Footer (<!-- -->)        │  ← Execution log, learnings
└────────────────────────────────────┘
```

---

## 2. Frontmatter Specification

```yaml
---
# ═══════════════════════════════════════════════════════════════
# IDENTITY
# ═══════════════════════════════════════════════════════════════
name: string                    # Required. Unique identifier.
version: semver                 # Required. Semantic version.
description: string             # Optional. Human description.

# ═══════════════════════════════════════════════════════════════
# TRIGGERS
# ═══════════════════════════════════════════════════════════════
trigger:
  # Scheduled execution
  schedule: cron | duration     # "0 9 * * MON" | "every 4h"

  # Event-driven
  webhook:
    path: string                # "/hooks/my-workflow"
    auth: none | basic | bearer | hmac

  # Manual trigger
  manual: boolean               # Allow CLI/API invocation

  # File watcher
  watch:
    paths: glob[]               # ["./data/**/*.json"]
    events: [created, modified, deleted]

  # Queue consumer
  queue:
    name: string                # "content-jobs"
    concurrency: number         # Max parallel

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════
config:
  key:
    type: string | number | boolean | enum[...]
    default: value
    description: string
    required: boolean

# ═══════════════════════════════════════════════════════════════
# SECRETS (names only, values from vault)
# ═══════════════════════════════════════════════════════════════
secrets:
  - API_KEY                     # $secrets.API_KEY in workflow
  - DATABASE_URL

# ═══════════════════════════════════════════════════════════════
# INPUT/OUTPUT SCHEMAS
# ═══════════════════════════════════════════════════════════════
input:
  field:
    type: Type
    required: boolean
    default: value

output:
  field:
    type: Type

# ═══════════════════════════════════════════════════════════════
# RUNTIME SETTINGS
# ═══════════════════════════════════════════════════════════════
runtime:
  timeout: duration             # "30m" max execution time
  retry: number                 # Global retry count
  concurrency: number           # Max parallel nodes
  context_budget: tokens        # "200k" AI context limit

# ═══════════════════════════════════════════════════════════════
# EVOLUTION (auto-populated)
# ═══════════════════════════════════════════════════════════════
evolution:
  generation: number
  parent: string
  fitness: number
  learnings: Learning[]
---
```

---

## 3. XML Body Specification

### 3.1 Root Element

```xml
<workflow>
  <!-- Global context -->
  <context>...</context>

  <!-- Phases (optional grouping) -->
  <phase name="...">...</phase>

  <!-- Or direct nodes -->
  <source>...</source>
  <transform>...</transform>
  <sink>...</sink>

  <!-- Error handling -->
  <on-error>...</on-error>
</workflow>
```

### 3.2 Node Types

#### Source Nodes (Data Input)

```xml
<!-- HTTP API -->
<source id="fetch-data" type="http">
  <request>
    method: GET | POST | PUT | DELETE
    url: string | template
    headers:
      Key: Value
    params:
      key: value
    body: object | template
    auth:
      type: bearer | basic | oauth2
      token: $secrets.TOKEN
  </request>
  <response>
    extract: jsonpath | jmespath
    validate: schema
  </response>
</source>

<!-- Database -->
<source id="query-db" type="database">
  <connection>$secrets.DATABASE_URL</connection>
  <query>
    SELECT * FROM users WHERE active = true
  </query>
  <params>
    key: value
  </params>
</source>

<!-- File -->
<source id="read-file" type="file">
  <path>./data/input.json</path>
  <format>json | csv | yaml | text | lines</format>
  <watch>boolean</watch>
</source>

<!-- Queue -->
<source id="consume" type="queue">
  <name>job-queue</name>
  <batch>10</batch>
  <visibility>30s</visibility>
</source>
```

#### Transform Nodes (Data Processing)

```xml
<!-- Map -->
<transform id="process" type="map" input="source.output">
  <expression>
    item => ({
      ...item,
      processed: true,
      timestamp: now()
    })
  </expression>
</transform>

<!-- Filter -->
<transform id="filter" type="filter" input="source.output">
  <condition>item.score > 0.5</condition>
</transform>

<!-- AI Transform -->
<ai id="analyze" model="sonnet | opus | haiku" input="data">
  <system>
    You are a helpful assistant.
  </system>
  <prompt>
    Analyze this data: {{input}}
  </prompt>
  <output type="Schema">
    <field name="summary" type="string"/>
    <field name="score" type="number"/>
  </output>
  <temperature>0.7</temperature>
  <max_tokens>1000</max_tokens>
</ai>

<!-- Template -->
<transform id="format" type="template" input="data">
  <template>
    # Report for {{data.name}}

    Generated: {{now()}}

    {{#each data.items}}
    - {{this.title}}: {{this.value}}
    {{/each}}
  </template>
</transform>

<!-- Aggregate -->
<transform id="summarize" type="reduce" input="items[]">
  <initial>{ total: 0, count: 0 }</initial>
  <reducer>
    (acc, item) => ({
      total: acc.total + item.value,
      count: acc.count + 1
    })
  </reducer>
  <finalize>
    result => ({
      ...result,
      average: result.total / result.count
    })
  </finalize>
</transform>
```

#### Sink Nodes (Data Output)

```xml
<!-- HTTP -->
<sink id="post-result" type="http" input="data">
  <request>
    method: POST
    url: https://api.example.com/webhook
    body: {{input}}
  </request>
</sink>

<!-- Email -->
<sink id="send-email" type="email" input="content">
  <provider>sendgrid | smtp | ses</provider>
  <config>
    api_key: $secrets.EMAIL_API_KEY
  </config>
  <message>
    to: recipient@example.com
    from: sender@example.com
    subject: {{content.subject}}
    html: {{content.body}}
  </message>
</sink>

<!-- File -->
<sink id="write-file" type="file" input="data">
  <path>./output/result-{{date('YYYY-MM-DD')}}.json</path>
  <format>json</format>
</sink>

<!-- Database -->
<sink id="insert" type="database" input="records">
  <connection>$secrets.DATABASE_URL</connection>
  <operation>insert | upsert | update</operation>
  <table>results</table>
  <batch>100</batch>
</sink>
```

### 3.3 Control Flow

#### Branching

```xml
<branch id="route" input="data">
  <!-- Pattern matching -->
  <match pattern="{ type: 'urgent', priority: > 8 }">
    <goto node="urgent-handler"/>
  </match>

  <match pattern="{ type: 'normal' }">
    <goto node="normal-handler"/>
  </match>

  <match pattern="{ tags: [*, 'featured', *] }">
    <goto node="featured-handler"/>
  </match>

  <!-- Default -->
  <otherwise>
    <goto node="default-handler"/>
  </otherwise>
</branch>

<!-- Simple conditional -->
<if condition="data.score > 0.8">
  <then>
    <goto node="high-score"/>
  </then>
  <else>
    <goto node="low-score"/>
  </else>
</if>
```

#### Loops

```xml
<!-- For-each -->
<foreach id="process-items" input="items" item="item">
  <parallel max="5">
    <ai model="haiku">Process: {{item}}</ai>
  </parallel>
</foreach>

<!-- While loop -->
<while id="retry-loop" condition="attempts < 3 AND NOT success">
  <do>
    <http id="try-request">...</http>
    <set var="success" value="{{try-request.status == 200}}"/>
    <set var="attempts" value="{{attempts + 1}}"/>
  </do>
</while>

<!-- Loop with break -->
<loop id="refinement" max="5">
  <ai id="improve">Improve: {{draft}}</ai>
  <ai id="evaluate">Score improvement: {{improve.output}}</ai>

  <break when="evaluate.score > 0.9"/>

  <set var="draft" value="{{improve.output}}"/>
</loop>
```

#### Parallel Execution

```xml
<parallel id="concurrent-tasks">
  <!-- Independent branches run simultaneously -->
  <branch>
    <ai id="task-a">Do A</ai>
  </branch>
  <branch>
    <ai id="task-b">Do B</ai>
  </branch>
  <branch>
    <ai id="task-c">Do C</ai>
  </branch>

  <!-- Wait strategy -->
  <wait for="all | any | n(2)"/>

  <!-- Merge results -->
  <merge strategy="concat | object | custom">
    <expression>
      branches => ({
        a: branches['task-a'].output,
        b: branches['task-b'].output,
        c: branches['task-c'].output
      })
    </expression>
  </merge>
</parallel>
```

#### Checkpoints (Human-in-the-Loop)

```xml
<checkpoint id="approval" type="required | optional">
  <condition>draft.word_count > 1000</condition>

  <prompt>
    Review the draft before publishing:

    {{draft.preview}}

    Word count: {{draft.word_count}}
  </prompt>

  <actions>
    <action id="approve" label="Approve">
      <goto node="publish"/>
    </action>
    <action id="edit" label="Request changes">
      <input type="text" name="feedback"/>
      <goto node="revision" with="feedback"/>
    </action>
    <action id="reject" label="Reject">
      <goto node="archive"/>
    </action>
  </actions>

  <timeout duration="24h">
    <goto node="auto-approve"/>
  </timeout>
</checkpoint>
```

### 3.4 Temporal Primitives

```xml
<!-- Delay -->
<delay duration="5s"/>

<!-- Throttle (rate limit) -->
<throttle id="rate-limit" input="items" rate="10/1m">
  <!-- Max 10 items per minute -->
</throttle>

<!-- Debounce (wait for quiet) -->
<debounce id="settle" input="events" quiet="30s">
  <!-- Wait until no new events for 30s -->
</debounce>

<!-- Batch (collect over time/count) -->
<batch id="collect" input="items"
       window="5m"
       max-size="100"
       flush-on="either">
  <!-- Flush after 5 minutes OR 100 items -->
</batch>

<!-- Timeout -->
<timeout duration="30s" on-timeout="fallback">
  <ai id="slow-task">...</ai>
</timeout>

<!-- Schedule -->
<schedule cron="0 9 * * MON">
  <trigger workflow="weekly-report"/>
</schedule>
```

### 3.5 Error Handling

```xml
<!-- Per-node error handling -->
<node id="risky-operation">
  <on-error>
    <!-- Retry -->
    <retry
      when="error.status IN [429, 503]"
      max="3"
      backoff="exponential | linear | fixed"
      base="1s"
      jitter="0.1"/>

    <!-- Fallback -->
    <fallback when="error.status == 500">
      <goto node="backup-operation"/>
    </fallback>

    <!-- Circuit breaker -->
    <circuit-breaker
      threshold="5"
      window="1m"
      cooldown="5m">
      <on-open>
        <goto node="degraded-mode"/>
      </on-open>
    </circuit-breaker>

    <!-- Dead letter queue -->
    <dlq when="retries-exhausted">
      <sink type="file" path="./errors/{{timestamp}}.json"/>
      <alert channel="slack" message="Operation failed: {{error}}"/>
    </dlq>
  </on-error>
</node>

<!-- Workflow-level error handling -->
<on-workflow-error>
  <snapshot path="./debug/{{run_id}}.json"/>
  <alert channel="pagerduty" severity="critical"/>
  <compensate>
    <!-- Rollback actions -->
  </compensate>
</on-workflow-error>
```

### 3.6 Context & State

```xml
<!-- Global context -->
<context id="global">
  <set key="timezone" value="UTC"/>
  <set key="env" value="$env.ENVIRONMENT"/>
  <import from="@config/defaults.yaml"/>
</context>

<!-- Scoped context -->
<context id="eu-region" inherit="global">
  <set key="data_retention" value="P30D"/>
  <set key="gdpr_mode" value="true"/>
</context>

<!-- State persistence -->
<state id="workflow-state">
  <persist to="file | redis | database">
    <connection>$secrets.REDIS_URL</connection>
  </persist>

  <fields>
    <field name="last_run" type="datetime"/>
    <field name="run_count" type="number" default="0"/>
    <field name="cursor" type="string"/>
  </fields>

  <ttl>P7D</ttl>
</state>

<!-- Accessing context/state -->
<ai>
  Using context: {{$context.timezone}}
  Using state: {{$state.cursor}}
</ai>
```

### 3.7 Composition

```xml
<!-- Include another workflow -->
<include src="@workflows/common/fetch-data.flow.md" as="fetch">
  <bind input.url="https://api.example.com"/>
  <bind input.auth="$secrets.API_KEY"/>
</include>

<!-- Reference included workflow output -->
<transform input="fetch.output">...</transform>

<!-- Call workflow as function -->
<call workflow="@workflows/ai/summarize.flow.md">
  <arg name="text" value="{{document.content}}"/>
  <arg name="length" value="short"/>
</call>
```

---

## 4. Expression Language

### Variables

```
$config.key           # Configuration value
$secrets.NAME         # Secret (redacted in logs)
$env.VAR              # Environment variable
$context.key          # Context value
$state.key            # Persistent state
$input.field          # Workflow input
$output.field         # Current node output

node_id.output        # Reference node output
phase.node.output     # Cross-phase reference
```

### Built-in Functions

```javascript
// Time
now()                           // Current timestamp
date(format)                    // Format date
parse_date(str, format)         // Parse date string
duration(spec)                  // Parse duration ("P1D")
add_time(date, duration)        // Add duration to date

// String
upper(s)                        // Uppercase
lower(s)                        // Lowercase
trim(s)                         // Trim whitespace
replace(s, old, new)            // Replace
split(s, delim)                 // Split to array
join(arr, delim)                // Join array
truncate(s, len, suffix)        // Truncate with suffix

// Array
length(arr)                     // Length
first(arr)                      // First element
last(arr)                       // Last element
slice(arr, start, end)          // Slice
filter(arr, predicate)          // Filter
map(arr, transform)             // Map
reduce(arr, reducer, init)      // Reduce
flatten(arr)                    // Flatten nested
unique(arr)                     // Remove duplicates
sort(arr, key, direction)       // Sort

// Object
keys(obj)                       // Get keys
values(obj)                     // Get values
entries(obj)                    // Get entries
get(obj, path, default)         // Get nested value
set(obj, path, value)           // Set nested value
merge(obj1, obj2)               // Merge objects
pick(obj, keys)                 // Pick keys
omit(obj, keys)                 // Omit keys

// Math
min(a, b)                       // Minimum
max(a, b)                       // Maximum
sum(arr)                        // Sum
avg(arr)                        // Average
round(n, decimals)              // Round
floor(n)                        // Floor
ceil(n)                         // Ceiling
abs(n)                          // Absolute value
random()                        // Random 0-1
random_int(min, max)            // Random integer

// Logic
coalesce(a, b, c)               // First non-null
if_else(cond, then, else)       // Ternary
switch(val, cases, default)     // Switch

// Type
typeof(val)                     // Type name
is_null(val)                    // Is null
is_array(val)                   // Is array
is_object(val)                  // Is object
to_string(val)                  // Convert to string
to_number(val)                  // Convert to number
to_boolean(val)                 // Convert to boolean

// Hash/Encode
hash(s, algorithm)              // Hash (md5, sha256)
base64_encode(s)                // Base64 encode
base64_decode(s)                // Base64 decode
url_encode(s)                   // URL encode
url_decode(s)                   // URL decode
json_encode(obj)                // JSON stringify
json_decode(s)                  // JSON parse

// UUID
uuid()                          // Generate UUID v4
```

### Pattern Matching Syntax

```javascript
// Exact match
{ type: 'newsletter' }

// Comparison operators
{ score: > 0.5 }
{ count: >= 10 }
{ status: != 'failed' }

// Array contains
{ tags: [*, 'featured', *] }    // Contains 'featured'
{ tags: ['urgent', *] }         // Starts with 'urgent'

// Regex
{ email: /.*@company\.com/ }

// Type check
{ data: typeof 'object' }

// Logical operators
{ type: 'A' } OR { type: 'B' }
{ active: true } AND { score: > 0.5 }
NOT { status: 'deleted' }
```

---

## 5. Type System

### Primitive Types

```
string                          # Text
number                          # Integer or float
boolean                         # true/false
datetime                        # ISO timestamp
duration                        # ISO duration (P1D, PT1H)
null                            # Null value
```

### Complex Types

```
Type[]                          # Array of Type
Type?                           # Optional Type
Type | OtherType                # Union type
{ key: Type }                   # Object shape
enum[a, b, c]                   # Enumeration
```

### Schema Definition

```xml
<schema name="NewsItem">
  <field name="id" type="string" required="true"/>
  <field name="title" type="string" required="true"/>
  <field name="content" type="string"/>
  <field name="author" type="Author"/>
  <field name="tags" type="string[]" default="[]"/>
  <field name="published" type="datetime?"/>
  <field name="status" type="enum[draft, review, published]"/>
  <field name="metadata" type="object"/>
</schema>

<schema name="Author">
  <field name="name" type="string" required="true"/>
  <field name="email" type="string" format="email"/>
</schema>
```

---

## 6. Markdown Footer (Execution Log)

The footer contains execution history and learnings, auto-populated by the engine:

```markdown
<!--
═══════════════════════════════════════════════════════════════
EXECUTION LOG (auto-populated by engine)
═══════════════════════════════════════════════════════════════

## Recent Runs

| Run ID | Started | Duration | Status | Output |
|--------|---------|----------|--------|--------|
| run-001 | 2025-02-01T09:00 | 4m32s | success | [link] |
| run-002 | 2025-01-25T09:00 | 5m01s | success | [link] |
| run-003 | 2025-01-18T09:00 | failed | timeout | [logs] |

## Learnings

### Pattern: X API rate limiting on Mondays
- Discovered: 2025-01-15
- Frequency: 3 occurrences
- Adaptation: Added 2s delay between requests
- Outcome: No rate limits since

### Pattern: Topics with <1000 tweets underperform
- Discovered: 2025-01-22
- Evidence: 5 runs with low engagement
- Adaptation: Filter threshold raised to 1000
- Outcome: Engagement up 23%

## Evolution History

| Version | Date | Change | Reason | Fitness |
|---------|------|--------|--------|---------|
| 2.3.1 | 2025-02-01 | Prompt tweak | AI drift | 0.87 |
| 2.3.0 | 2025-01-15 | Added filter | Performance | 0.82 |
| 2.2.0 | 2025-01-01 | Initial | - | 0.75 |

-->
```

---

## 7. CLI Interface

```bash
# Run workflow
flowscript run workflow.flow.md
flowscript run workflow.flow.md --config key=value
flowscript run workflow.flow.md --input '{"field": "value"}'
flowscript run workflow.flow.md --dry-run

# Watch mode
flowscript watch workflow.flow.md

# Validate
flowscript validate workflow.flow.md
flowscript validate workflow.flow.md --strict

# Test
flowscript test workflow.flow.md
flowscript test workflow.flow.md --coverage

# Debug
flowscript debug workflow.flow.md --breakpoint node-id
flowscript replay run-id --from node-id

# Inspect
flowscript inspect workflow.flow.md           # Show structure
flowscript inspect workflow.flow.md --deps    # Show dependencies
flowscript inspect workflow.flow.md --schema  # Show types

# Registry
flowscript publish workflow.flow.md
flowscript install @author/workflow@version
flowscript search "newsletter automation"
```

---

## 8. Example: Complete Newsletter Workflow

```yaml
---
name: weekly-tech-digest
version: 1.0.0
description: |
  Gathers trending tech topics, researches each,
  composes a newsletter, and sends to subscribers.

trigger:
  schedule: "0 9 * * MON"
  manual: true

config:
  topic_count:
    type: number
    default: 10
    description: Number of topics to include

  style:
    type: enum[formal, casual, technical]
    default: casual

secrets:
  - X_API_KEY
  - SENDGRID_API_KEY
  - DATABASE_URL

output:
  sent_count: number
  newsletter_url: string
---
```

```xml
<workflow>

<context>
  <set key="run_date" value="{{date('YYYY-MM-DD')}}"/>
</context>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 1: GATHER                                             -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="gather">

  <source id="fetch-trends" type="http">
    <request>
      method: GET
      url: https://api.x.com/2/trends
      headers:
        Authorization: Bearer $secrets.X_API_KEY
    </request>
    <response>
      extract: $.trends[:{{$config.topic_count}}]
    </response>
    <on-error>
      <retry when="status == 429" max="3" backoff="exponential"/>
    </on-error>
  </source>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 2: RESEARCH                                           -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="research">

  <foreach id="research-topics" input="gather.fetch-trends.output" item="topic">
    <parallel max="5">

      <ai id="deep-research" model="sonnet">
        <system>You are a tech researcher.</system>
        <prompt>
          Research "{{topic.name}}":
          1. What is it?
          2. Why trending?
          3. Key facts (3-5)
          4. Reader takeaway
        </prompt>
        <output type="Research">
          <field name="summary" type="string"/>
          <field name="why_trending" type="string"/>
          <field name="facts" type="string[]"/>
          <field name="takeaway" type="string"/>
        </output>
      </ai>

    </parallel>
  </foreach>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 3: COMPOSE                                            -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="compose">

  <ai id="rank" model="sonnet" input="research.research-topics.output">
    <prompt>
      Rank these topics by reader interest:
      {{input}}

      Return ordered list of topic names.
    </prompt>
  </ai>

  <ai id="draft" model="opus">
    <system>
      You write {{$config.style}} tech newsletters.
    </system>
    <prompt>
      Write newsletter using these ranked topics:

      {{rank.output}}

      Research data:
      {{research.research-topics.output}}

      Sections: Hook, Top Stories (3), Quick Hits, Closing
    </prompt>
    <output type="Newsletter">
      <field name="subject" type="string"/>
      <field name="html" type="string"/>
      <field name="text" type="string"/>
    </output>
  </ai>

  <loop id="self-review" max="2">
    <ai id="critique" model="opus">
      <prompt>
        Review this newsletter critically:
        {{draft.output.html}}

        Score 1-10. If < 8, suggest improvements.
      </prompt>
    </ai>

    <break when="critique.output.score >= 8"/>

    <ai id="revise" model="opus" input="draft.output">
      <prompt>
        Improve based on feedback:
        {{critique.output.feedback}}
      </prompt>
    </ai>

    <set var="draft.output" value="{{revise.output}}"/>
  </loop>

  <checkpoint id="human-review" type="optional">
    <prompt>
      Newsletter ready. Subject: {{draft.output.subject}}
    </prompt>
    <actions>
      <action id="approve" label="Send"/>
      <action id="edit" label="Edit">
        <input type="text" name="edits"/>
        <goto node="apply-edits"/>
      </action>
    </actions>
    <timeout duration="1h">
      <goto node="deliver"/>
    </timeout>
  </checkpoint>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- PHASE 4: DELIVER                                            -->
<!-- ═══════════════════════════════════════════════════════════ -->

<phase name="deliver">

  <source id="subscribers" type="database">
    <connection>$secrets.DATABASE_URL</connection>
    <query>
      SELECT email, name FROM subscribers WHERE active = true
    </query>
  </source>

  <foreach id="send" input="subscribers.output" item="sub">
    <throttle rate="100/1m">
      <sink id="email" type="email">
        <provider>sendgrid</provider>
        <config>
          api_key: $secrets.SENDGRID_API_KEY
        </config>
        <message>
          to: {{sub.email}}
          from: digest@techweekly.com
          subject: {{compose.draft.output.subject}}
          html: {{compose.draft.output.html | replace('{{name}}', sub.name)}}
        </message>
      </sink>
    </throttle>
  </foreach>

  <sink id="archive" type="file">
    <path>./archive/{{$context.run_date}}.md</path>
    <content>
      # {{compose.draft.output.subject}}

      Sent: {{now()}}
      Recipients: {{deliver.send.success_count}}

      ---

      {{compose.draft.output.html}}
    </content>
  </sink>

</phase>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- OUTPUT                                                       -->
<!-- ═══════════════════════════════════════════════════════════ -->

<output>
  <set field="sent_count" value="{{deliver.send.success_count}}"/>
  <set field="newsletter_url" value="{{deliver.archive.path}}"/>
</output>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- ERROR HANDLING                                               -->
<!-- ═══════════════════════════════════════════════════════════ -->

<on-workflow-error>
  <alert channel="slack" webhook="$secrets.SLACK_WEBHOOK">
    Newsletter workflow failed at {{$execution.current_node}}
    Error: {{$error.message}}
  </alert>
  <snapshot path="./debug/{{$execution.run_id}}.json"/>
</on-workflow-error>

</workflow>
```

```markdown
<!--
═══════════════════════════════════════════════════════════════
EXECUTION LOG
═══════════════════════════════════════════════════════════════

## Recent Runs

| Run | Date | Duration | Status | Sent |
|-----|------|----------|--------|------|
| #47 | 2025-02-01 | 4m12s | success | 2,847 |
| #46 | 2025-01-25 | 3m58s | success | 2,831 |

## Learnings

### Optimal send time
- Discovery: 9am UTC has 23% higher open rate than 8am
- Confidence: High (12 weeks data)

### Topic filtering
- Topics with <1000 tweets have 40% lower click rates
- Adapted: Filter threshold set to 1000

-->
```

---

This specification defines a complete, implementable workflow format that combines the best of:
- **LPL's structure** (phases, steps, agents)
- **n8n's power** (nodes, connections, triggers)
- **AI's capabilities** (reasoning, generation, verification)
- **Git's workflow** (text-native, reviewable, versionable)
