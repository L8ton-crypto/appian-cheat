// New patterns to append to designPatterns array in lib/design-patterns.ts
// Also add two new categories to designPatternCategories: "Performance", "Records & Data"

export const newPatterns = [
  // ==================== PERFORMANCE PATTERNS ====================
  {
    id: "perf-query-optimization",
    title: "Query Optimization Pattern",
    category: "Performance",
    difficulty: "intermediate",
    overview: "Optimize record queries and data fetches by using proper filtering, pagination, and batch sizes to avoid performance degradation in production environments.",
    problem: "Applications slow down as data grows. Queries that worked fine with 100 records timeout with 100,000. Common culprits: unfiltered record lists, missing pagination, fetching all fields when only a few are needed, and running multiple sequential queries instead of using related records.",
    solution: "Apply query optimization at every layer. Use queryRecordType with explicit filters instead of loading full datasets. Always paginate with a!pagingInfo. Use fetchTotalCount only when needed (it doubles query cost). Leverage source filters on record types to pre-filter at the DB level. Use related records instead of multiple separate queries.",
    codeExamples: [
      {
        title: "Bad - Loading Everything",
        code: `/* BAD: Loads ALL records, then filters client-side */
a!localVariables(
  local!allOrders: a!queryRecordType(
    recordType: 'recordType!Order',
    pagingInfo: a!pagingInfo(1, -1)  /* -1 = all rows! */
  ).data,
  
  /* Client-side filter - SLOW with large datasets */
  local!filtered: filter(
    local!allOrders,
    fv!item.status = "Active" 
      and fv!item.createdDate > today() - 30
  ),
  ...
)`,
        description: "Never load all records and filter client-side"
      },
      {
        title: "Good - Server-Side Filtering with Pagination",
        code: `/* GOOD: Filter at the query level, paginate results */
a!localVariables(
  local!pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 25,
    sort: a!sortInfo(
      field: 'recordType!Order.fields.createdDate',
      ascending: false
    )
  ),
  
  local!results: a!queryRecordType(
    recordType: 'recordType!Order',
    filters: a!queryLogicalExpression(
      operator: "AND",
      filters: {
        a!queryFilter(
          field: 'recordType!Order.fields.status',
          operator: "=",
          value: "Active"
        ),
        a!queryFilter(
          field: 'recordType!Order.fields.createdDate',
          operator: ">",
          value: today() - 30
        )
      }
    ),
    pagingInfo: local!pagingInfo,
    fetchTotalCount: true  /* Only when you need total for paging UI */
  ),
  
  /* Use local!results.data for display */
  /* Use local!results.totalCount for paging controls */
  ...
)`,
        description: "Query only what you need, let the DB do the filtering"
      }
    ],
    bestPractices: [
      "Always use a!queryFilter to push filtering to the database",
      "Set reasonable batchSize (20-50 for UI grids, up to 5000 for batch processing)",
      "Only use fetchTotalCount: true when displaying total count in the UI",
      "Add database indexes on columns used in filters and sort",
      "Use related record fields instead of separate queries for joined data",
      "Avoid a!pagingInfo with batchSize: -1 in production interfaces"
    ],
    pitfalls: [
      "Using batchSize: -1 (fetch all) in user-facing interfaces",
      "Filtering in SAIL expressions after querying all records",
      "Running fetchTotalCount on every query when the count is not displayed",
      "Not adding indexes on frequently filtered/sorted columns",
      "Using todatevalue() or tostring() in filters - prevents index usage"
    ],
    whenToUse: [
      "Any interface displaying a list or grid of records",
      "Reports and dashboards with large datasets",
      "Background processes that query data for batch operations",
      "Search interfaces with user-defined filters"
    ],
    whenNotToUse: [
      "Small static reference data (under 100 rows) where caching is more appropriate",
      "Data already in local variables from a previous query in the same expression"
    ],
    relatedPatterns: ["perf-caching-strategy", "data-source-filter"],
    tags: ["performance", "query", "pagination", "optimization", "records", "database"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Query_Recipes.html"
  },
  {
    id: "perf-caching-strategy",
    title: "Expression Caching Strategy",
    category: "Performance",
    difficulty: "advanced",
    overview: "Use Appian's expression caching to reduce redundant queries and computation. Cache expression rule results that are expensive to compute and don't change frequently.",
    problem: "Expression rules get evaluated on every interface refresh. If a rule queries the database or calls an integration, it runs repeatedly even when the data has not changed. This wastes server resources and creates slow user experiences, especially on interfaces with multiple components calling the same expensive rule.",
    solution: "Enable caching on expression rules that query data or perform expensive computation. Set appropriate cache durations based on how frequently data changes. Use rule inputs as cache keys so different parameters get separate cached results. Combine with a!localVariables to avoid re-evaluating the same rule multiple times in one interface.",
    codeExamples: [
      {
        title: "Cacheable Expression Rule Configuration",
        code: `/* Expression Rule: rule!getActiveUserCount
   Cache Duration: 5 minutes
   
   In the rule configuration panel:
   - Enable "Cache the result for" 
   - Set to 5 minutes
   
   The cache key is automatically based on rule inputs.
   Same inputs = cached result. Different inputs = separate cache entry.
*/

/* Rule Definition */
a!queryRecordType(
  recordType: 'recordType!User',
  filters: a!queryFilter(
    field: 'recordType!User.fields.status',
    operator: "=",
    value: "Active"
  ),
  pagingInfo: a!pagingInfo(1, 0),
  fetchTotalCount: true
).totalCount

/* This query runs ONCE per 5 minutes, regardless of 
   how many users have the dashboard open */`,
        description: "Cache expensive queries with appropriate TTL"
      },
      {
        title: "Local Variable Deduplication",
        code: `/* BAD: Same rule called 3 times = 3 evaluations */
{
  a!cardLayout(
    contents: rule!getUserStats(ri!userId)  /* Call 1 */
  ),
  a!richTextDisplayField(
    value: rule!getUserStats(ri!userId).name  /* Call 2 */
  ),
  a!textField(
    value: rule!getUserStats(ri!userId).email  /* Call 3 */
  )
}

/* GOOD: Evaluate once, reference the local variable */
a!localVariables(
  local!userStats: rule!getUserStats(ri!userId),  /* Single call */
  {
    a!cardLayout(
      contents: local!userStats
    ),
    a!richTextDisplayField(
      value: local!userStats.name
    ),
    a!textField(
      value: local!userStats.email
    )
  }
)`,
        description: "Use localVariables to avoid redundant rule evaluations"
      }
    ],
    bestPractices: [
      "Cache expression rules that query data, not rules that format or transform data",
      "Set cache duration based on data freshness needs: 1 min for dashboards, 15 min for reference data",
      "Use a!localVariables to store the result of any expression used more than once",
      "Monitor cache hit rates in the Admin Console under Expression Rule Performance",
      "Keep rule inputs simple (primitives, not complex CDTs) for effective cache keys",
      "Do not cache rules with side effects or rules that return user-specific data unless keyed by user"
    ],
    pitfalls: [
      "Caching rules that return user-specific data without user input as a cache key",
      "Setting cache duration too high for frequently changing data (stale results)",
      "Caching rules with no inputs (global cache - one wrong result affects everyone)",
      "Not using localVariables and calling the same cached rule 10 times (still has lookup overhead)",
      "Caching rules that return large CDT arrays (high memory usage per cache entry)"
    ],
    whenToUse: [
      "Dashboard summary cards (total counts, averages, KPIs)",
      "Reference data lookups (dropdown options, configuration values)",
      "Rules called from multiple components on the same interface",
      "Expensive aggregation queries that do not need real-time accuracy"
    ],
    whenNotToUse: [
      "Rules that must return real-time data (live stock prices, queue lengths)",
      "Rules with side effects (writing data, triggering processes)",
      "Rules with many unique input combinations (cache explosion)",
      "Simple transformation rules (concatenation, formatting) - overhead of caching exceeds computation"
    ],
    relatedPatterns: ["perf-query-optimization", "int-cache-first"],
    tags: ["performance", "caching", "expression-rules", "optimization", "memory"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Expression_Rule_Object.html"
  },

  // ==================== RECORDS & DATA PATTERNS ====================
  {
    id: "rec-write-back",
    title: "Record Write-Back Pattern",
    category: "Records & Data",
    difficulty: "beginner",
    overview: "Use record type write-back to create, update, and delete records directly from interfaces without building process models. Simplifies CRUD operations significantly.",
    problem: "Traditional Appian CRUD requires a process model for every write operation - create, update, delete each need separate flows. This leads to dozens of small process models cluttering the application, each doing basic data writes with minimal logic.",
    solution: "Use record type write-back functions (a!save on record type fields) to write data directly from the interface. Combine with a!writeRecords and a!deleteRecords for batch operations. Reserve process models for writes that need human approval, complex validation, or multi-step transactions.",
    codeExamples: [
      {
        title: "Inline Edit with Write-Back",
        code: `/* Editable record field with direct write-back */
a!localVariables(
  local!record: ri!record,
  local!saving: false,
  
  a!formLayout(
    label: "Edit Customer",
    contents: {
      a!textField(
        label: "Company Name",
        value: local!record['recordType!Customer.fields.companyName'],
        saveInto: local!record['recordType!Customer.fields.companyName']
      ),
      a!textField(
        label: "Contact Email",
        value: local!record['recordType!Customer.fields.email'],
        saveInto: local!record['recordType!Customer.fields.email'],
        validations: if(
          search("@", local!record['recordType!Customer.fields.email']) = 0,
          "Enter a valid email address",
          {}
        )
      ),
      a!dropdownField(
        label: "Status",
        choiceLabels: {"Active", "Inactive", "Prospect"},
        choiceValues: {"Active", "Inactive", "Prospect"},
        value: local!record['recordType!Customer.fields.status'],
        saveInto: local!record['recordType!Customer.fields.status']
      )
    },
    buttons: a!buttonLayout(
      primaryButtons: a!buttonWidget(
        label: "Save",
        style: "PRIMARY",
        saveInto: {
          a!save(local!saving, true),
          a!writeRecords(
            records: local!record,
            onSuccess: {
              a!save(local!saving, false),
              a!navigate(link: a!recordLink(recordType: 'recordType!Customer', identifier: local!record['recordType!Customer.fields.id']))
            },
            onError: a!save(local!saving, false)
          )
        },
        validate: true,
        disabled: local!saving
      )
    )
  )
)`,
        description: "Direct record write without a process model"
      }
    ],
    bestPractices: [
      "Use write-back for simple CRUD - create, update, delete without approval workflows",
      "Always validate inputs before writing (use field validations and a!buttonWidget validate: true)",
      "Use a!writeRecords for single or batch writes, a!deleteRecords for deletions",
      "Show loading state while the write is in progress (disable button, show spinner)",
      "Navigate to the record view after a successful save",
      "Add onError handling to show user-friendly error messages"
    ],
    pitfalls: [
      "Using write-back for operations that need audit trails - use process models instead",
      "Not handling onError - users see nothing when a write fails",
      "Writing back to record types without proper security rules",
      "Batch writing thousands of records from an interface (use a process model for large batches)",
      "Forgetting to set validate: true on the save button"
    ],
    whenToUse: [
      "Simple data entry forms (create/edit records)",
      "Inline editing in grids and lists",
      "Quick status updates (toggle active/inactive)",
      "Self-service forms where users edit their own data"
    ],
    whenNotToUse: [
      "Writes that require manager approval or multi-step workflows",
      "Operations that must trigger downstream processes (notifications, integrations)",
      "Batch imports or migrations (use a process model with looping)",
      "Writes that need complex server-side validation beyond what SAIL can do"
    ],
    relatedPatterns: ["rec-related-aggregation", "sail-editable-grid"],
    tags: ["records", "write-back", "CRUD", "interfaces", "data"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Records_Tutorial.html"
  },
  {
    id: "rec-related-aggregation",
    title: "Related Record Aggregation",
    category: "Records & Data",
    difficulty: "intermediate",
    overview: "Use related record relationships and record-level aggregations to build dashboards and summary views without writing custom queries or joining data in expressions.",
    problem: "Building summary dashboards requires aggregating data across multiple tables - total orders per customer, average resolution time per category, count of open tickets per team. Without related records, developers write multiple queries and join them in expressions, which is complex and slow.",
    solution: "Define record type relationships (one-to-many, many-to-one) between your record types. Then use a!measure and a!grouping in a!queryRecordType to aggregate related data in a single query. Appian generates the SQL joins automatically.",
    codeExamples: [
      {
        title: "Dashboard with Related Record Aggregation",
        code: `/* Customer record type with relationship to Orders */
/* Relationship defined in record type: Customer -> Orders (one-to-many) */

/* Query: Top customers by order value */
a!queryRecordType(
  recordType: 'recordType!Customer',
  fields: {
    a!grouping(
      field: 'recordType!Customer.fields.companyName',
      alias: "customerName"
    ),
    a!grouping(
      field: 'recordType!Customer.fields.status',
      alias: "status"
    ),
    a!measure(
      field: 'recordType!Customer.relationships.orders.fields.total',
      function: "SUM",
      alias: "totalRevenue"
    ),
    a!measure(
      field: 'recordType!Customer.relationships.orders.fields.id',
      function: "COUNT",
      alias: "orderCount"
    ),
    a!measure(
      field: 'recordType!Customer.relationships.orders.fields.createdDate',
      function: "MAX",
      alias: "lastOrderDate"
    )
  },
  filters: a!queryFilter(
    field: 'recordType!Customer.fields.status',
    operator: "=",
    value: "Active"
  ),
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 10,
    sort: a!sortInfo(field: "totalRevenue", ascending: false)
  )
)`,
        description: "Single query replaces multiple queries and manual joins"
      }
    ],
    bestPractices: [
      "Define relationships in the record type configuration - not in expressions",
      "Use alias names that match your display labels for readability",
      "Combine a!grouping and a!measure in one query instead of querying each table separately",
      "Sort by aggregated fields (alias names) to show most relevant data first",
      "Use filters on the base record type to reduce the dataset before aggregation",
      "Consider database indexes on foreign key columns used in relationships"
    ],
    pitfalls: [
      "Aggregating across too many relationship levels (Customer -> Orders -> LineItems -> Products) can be slow",
      "Not defining the relationship in the record type and trying to join manually in expressions",
      "Forgetting that null related records are excluded from aggregations by default",
      "Using SUM/COUNT on text fields by accident (check field types)",
      "Not testing with production-scale data - aggregation queries can be expensive"
    ],
    whenToUse: [
      "Dashboard summary cards (totals, counts, averages)",
      "Report builders with grouped and aggregated data",
      "KPI displays showing metrics across related tables",
      "Any view that summarizes one-to-many related data"
    ],
    whenNotToUse: [
      "Fetching individual record details (just query the record directly)",
      "Very complex multi-step calculations that need procedural logic",
      "Data from external systems not backed by Appian record types"
    ],
    relatedPatterns: ["rec-write-back", "perf-query-optimization", "data-normalised-cdt"],
    tags: ["records", "aggregation", "relationships", "dashboard", "queries", "reporting"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Querying_from_Related_Record_Types.html"
  },
  {
    id: "rec-sync-strategy",
    title: "Record Sync Strategy",
    category: "Records & Data",
    difficulty: "advanced",
    overview: "Choose the right data sync strategy for your record types - synced (cached in Appian), real-time (direct DB query), or hybrid. Understand the trade-offs of each approach.",
    problem: "Record types can sync data into Appian's cache or query the source directly. Choosing wrong leads to stale data (sync too infrequent), slow interfaces (no sync on large tables), or sync failures (tables too large or changing too fast).",
    solution: "Use synced record types for tables under 5 million rows that don't change more than a few hundred times per minute. Use real-time for very large tables, rapidly changing data, or when you need guaranteed up-to-the-second accuracy. Use timer-based sync for integration-backed data that changes infrequently.",
    codeExamples: [
      {
        title: "Sync Decision Matrix",
        code: `/* Record Sync Decision Guide:

   SYNCED (Appian Cache) - Use when:
   +---------------------------------+
   | Table rows < 5 million          |
   | Changes < 100/minute            |
   | Related record joins needed     |
   | Aggregation queries needed      |
   | User-facing search/filter       |
   +---------------------------------+
   
   REAL-TIME (Direct Query) - Use when:
   +---------------------------------+
   | Table rows > 5 million          |
   | Data changes very rapidly       |
   | Must reflect changes instantly  |
   | External DB you don't control   |
   | Simple queries only (no joins)  |
   +---------------------------------+

   Sync Trigger Options:
   - Automatic: Detects inserts/updates/deletes (best for most cases)
   - Timer: Syncs on a schedule (every 1-60 min)
   - Manual: Triggered via a!syncRecords in process model
   
   Force manual sync after:
   - Bulk data imports (ETL loads)
   - Direct database modifications (outside Appian)
   - Migration scripts
*/

/* Manual sync trigger in a process model */
/* Use after a batch import completes */
a!syncRecords(
  recordType: 'recordType!Order',
  identifiers: {101, 102, 103}  /* Sync specific records */
)

/* Or sync all */
a!syncRecords(
  recordType: 'recordType!Order'
  /* No identifiers = full resync */
)`,
        description: "Choose the right sync strategy based on data characteristics"
      }
    ],
    bestPractices: [
      "Default to synced record types - they enable related records, aggregation, and faster queries",
      "Monitor sync health in the Admin Console - failed syncs mean stale data",
      "After bulk data operations, trigger a!syncRecords to update the cache",
      "Use source filters to reduce the synced dataset (only sync active records, recent records, etc.)",
      "Test sync performance with realistic data volumes before going to production",
      "Set up alerts for sync failures - add sync monitoring to your admin dashboard"
    ],
    pitfalls: [
      "Syncing a 10-million-row table and wondering why sync takes 20 minutes",
      "Assuming synced data is real-time (there is always a small delay)",
      "Not triggering manual sync after ETL jobs or direct DB modifications",
      "Using real-time queries and then trying to use related records (not supported)",
      "Ignoring sync errors in the Admin Console"
    ],
    whenToUse: [
      "Every record type needs a sync strategy - choose deliberately",
      "Applications with related record joins must use synced record types",
      "Data migration projects need manual sync triggers",
      "Admin dashboards should include sync health monitoring"
    ],
    whenNotToUse: [
      "The question is not when to use sync strategy - it is which strategy to pick. See the decision matrix."
    ],
    relatedPatterns: ["perf-query-optimization", "data-source-filter"],
    tags: ["records", "sync", "caching", "data-source", "performance", "architecture"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Syncing_Data.html"
  },

  // ==================== MORE INTEGRATION PATTERNS ====================
  {
    id: "int-webhook-receiver",
    title: "Webhook Receiver Pattern",
    category: "Integration",
    difficulty: "intermediate",
    overview: "Receive inbound webhooks from external systems using Appian Web APIs. Process incoming events, validate payloads, and trigger appropriate workflows.",
    problem: "External systems (Stripe, GitHub, Salesforce, etc.) need to notify Appian when events occur. Polling for changes is wasteful and introduces delays. You need an endpoint that can receive HTTP POST requests, validate them, and act on the data.",
    solution: "Create an Appian Web API endpoint that receives webhook payloads. Use API key or HMAC signature validation for security. Parse the incoming JSON, write to a staging table, and start a process model to handle the event asynchronously. Always return 200 quickly to avoid webhook timeouts.",
    codeExamples: [
      {
        title: "Web API Webhook Endpoint",
        code: `/* Web API: POST /webhook/payment-update 
   Security: API Key in header
   
   Expression (Web API body): */

a!localVariables(
  local!payload: a!fromJson(http!request.body),
  local!apiKey: http!request.headers.x-api-key,
  
  /* Step 1: Validate API key */
  if(
    local!apiKey <> cons!WEBHOOK_API_KEY,
    a!httpResponse(
      statusCode: 401,
      body: a!toJson(a!map(error: "Unauthorized"))
    ),
    
    /* Step 2: Quick validation of required fields */
    if(
      or(
        isnull(local!payload.eventType),
        isnull(local!payload.referenceId)
      ),
      a!httpResponse(
        statusCode: 400,
        body: a!toJson(a!map(error: "Missing required fields"))
      ),
      
      /* Step 3: Write to staging and start async process */
      a!localVariables(
        local!webhookLog: a!writeRecords(
          records: 'recordType!WebhookLog'(
            eventType: local!payload.eventType,
            referenceId: local!payload.referenceId,
            payload: http!request.body,
            receivedAt: now(),
            status: "Pending"
          )
        ),
        
        /* Step 4: Start process asynchronously */
        a!startProcess(
          processModel: cons!PM_PROCESS_WEBHOOK,
          processParameters: a!map(
            webhookLogId: local!webhookLog.id,
            eventType: local!payload.eventType
          )
        ),
        
        /* Step 5: Return 200 immediately */
        a!httpResponse(
          statusCode: 200,
          body: a!toJson(a!map(
            received: true,
            id: local!webhookLog.id
          ))
        )
      )
    )
  )
)`,
        description: "Receive, validate, store, and process webhooks asynchronously"
      }
    ],
    bestPractices: [
      "Always return 200 quickly - process the webhook asynchronously via a process model",
      "Log every incoming webhook to a staging table for debugging and replay",
      "Validate the API key or HMAC signature before processing any data",
      "Handle duplicate webhooks (idempotency) - check if referenceId was already processed",
      "Set up a retry queue - if processing fails, mark as failed and retry later",
      "Do not put complex logic in the Web API expression - keep it thin"
    ],
    pitfalls: [
      "Processing the webhook synchronously in the Web API (timeout risk)",
      "Not logging incoming webhooks (impossible to debug failures later)",
      "Trusting webhook data without validation (spoofing risk)",
      "Not handling duplicates (many webhook providers retry on timeout)",
      "Returning errors for non-critical validation failures (triggers unnecessary retries)"
    ],
    whenToUse: [
      "Payment gateway callbacks (Stripe, PayPal)",
      "Source control events (GitHub, GitLab, Bitbucket)",
      "CRM sync notifications (Salesforce, HubSpot)",
      "Any external system that supports webhook notifications"
    ],
    whenNotToUse: [
      "Polling-only APIs that do not support webhooks (use scheduled processes instead)",
      "Internal Appian-to-Appian communication (use process messaging or record events)",
      "Real-time bidirectional communication (consider message queues or streaming)"
    ],
    relatedPatterns: ["int-retry-pattern", "int-cache-first"],
    tags: ["integration", "webhook", "web-api", "REST", "async", "external-systems"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Web_APIs.html"
  },
  {
    id: "int-error-logging",
    title: "Integration Error Logging Pattern",
    category: "Integration",
    difficulty: "intermediate",
    overview: "Centralised error logging for all integrations. Track failures, response times, and error rates to diagnose issues quickly and measure integration health.",
    problem: "Integrations fail silently. A process model calls an external API, gets an error, and the only evidence is buried in the process instance history. When multiple integrations fail, there is no dashboard to see which ones, how often, or why.",
    solution: "Create a central IntegrationLog record type. Every integration call writes a log entry with the endpoint, status, response time, and any error details. Build an admin dashboard showing integration health, error rates, and recent failures. Use expression rules to wrap integration calls with logging.",
    codeExamples: [
      {
        title: "Integration Wrapper with Logging",
        code: `/* Expression Rule: rule!int_callWithLogging
   Inputs: 
     ri!integrationName (Text)
     ri!connectedSystem (Connected System)
     ri!endpoint (Text)
     ri!requestBody (Map)
*/
a!localVariables(
  local!startTime: now(),
  local!response: a!httpQuery(
    connectedSystem: ri!connectedSystem,
    path: ri!endpoint,
    method: "POST",
    body: a!toJson(ri!requestBody)
  ),
  local!duration: intervalds(local!startTime, now()),
  local!isError: local!response.statusCode < 200 
    or local!response.statusCode >= 300,
  
  /* Log the call */
  a!writeRecords(
    records: 'recordType!IntegrationLog'(
      integrationName: ri!integrationName,
      endpoint: ri!endpoint,
      statusCode: local!response.statusCode,
      responseTimeMs: tointeger(
        tointervalds(local!duration) * 1000
      ),
      isError: local!isError,
      errorMessage: if(local!isError, 
        local!response.body, null),
      calledAt: local!startTime
    )
  ),
  
  /* Return the response */
  local!response
)

/* Admin Dashboard Query - Error Rate Last 24h */
a!queryRecordType(
  recordType: 'recordType!IntegrationLog',
  fields: {
    a!grouping(
      field: 'recordType!IntegrationLog.fields.integrationName',
      alias: "name"
    ),
    a!measure(
      field: 'recordType!IntegrationLog.fields.id',
      function: "COUNT",
      alias: "totalCalls"
    ),
    a!measure(
      field: 'recordType!IntegrationLog.fields.isError',
      function: "SUM",
      alias: "errorCount"
    ),
    a!measure(
      field: 'recordType!IntegrationLog.fields.responseTimeMs',
      function: "AVG",
      alias: "avgResponseTime"
    )
  },
  filters: a!queryFilter(
    field: 'recordType!IntegrationLog.fields.calledAt',
    operator: ">",
    value: now() - intervalds(1, 0, 0, 0)
  ),
  pagingInfo: a!pagingInfo(1, 20, 
    a!sortInfo("errorCount", false))
)`,
        description: "Wrap every integration call with logging, then query for dashboards"
      }
    ],
    bestPractices: [
      "Log every integration call - success and failure - for complete visibility",
      "Include response time to catch slow integrations before they timeout",
      "Build an admin dashboard with error rates, avg response times, and recent failures",
      "Set up process-based alerts when error rate exceeds a threshold",
      "Retain logs for 90 days minimum for trend analysis",
      "Group log entries by integration name for per-system health tracking"
    ],
    pitfalls: [
      "Logging only errors (you miss performance degradation and success patterns)",
      "Storing full request/response bodies (can contain sensitive data, bloats the table)",
      "Not cleaning up old logs (table grows forever)",
      "Making the logging call synchronous when it could be fire-and-forget"
    ],
    whenToUse: [
      "All production applications with external integrations",
      "Applications with SLA requirements on integration uptime",
      "Systems that call multiple third-party APIs",
      "Any integration that has historically been unreliable"
    ],
    whenNotToUse: [
      "Internal Appian record queries (these are not integrations)",
      "Development/sandbox environments where logging overhead is unwanted"
    ],
    relatedPatterns: ["int-retry-pattern", "int-webhook-receiver", "pm-exception-flow"],
    tags: ["integration", "logging", "monitoring", "error-handling", "admin", "observability"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Integration_Monitoring.html"
  },

  // ==================== MORE INTERFACE (SAIL) PATTERNS ====================
  {
    id: "sail-responsive-cards",
    title: "Responsive Card Grid Pattern",
    category: "Interface (SAIL)",
    difficulty: "beginner",
    overview: "Build responsive card-based layouts that adapt to desktop and mobile screen sizes. Display data in visually appealing card grids instead of dense tables.",
    problem: "Tables and grids are the default for displaying data in Appian, but they look cramped on mobile and lack visual appeal on dashboards. Users want card-based layouts like modern web apps, but SAIL does not have a native responsive grid component.",
    solution: "Use a!columnsLayout with a!columnLayout to create responsive card grids. Combine with a!cardLayout for each item. Use a!forEach to generate cards dynamically from data. Set column width properties to stack on mobile automatically.",
    codeExamples: [
      {
        title: "Responsive Card Grid for Records",
        code: `/* 3-column card grid that stacks on mobile */
a!localVariables(
  local!items: a!queryRecordType(
    recordType: 'recordType!Project',
    pagingInfo: a!pagingInfo(1, 12)
  ).data,
  
  /* Split items into rows of 3 */
  local!rows: a!forEach(
    items: enumerate(ceiling(count(local!items) / 3)),
    expression: a!localVariables(
      local!startIdx: fv!index * 3 + 1,
      local!rowItems: index(
        local!items,
        intersection(
          {local!startIdx, local!startIdx + 1, local!startIdx + 2},
          1 + enumerate(count(local!items))
        ),
        {}
      ),
      
      a!columnsLayout(
        columns: a!forEach(
          items: local!rowItems,
          expression: a!columnLayout(
            contents: a!cardLayout(
              contents: {
                a!richTextDisplayField(
                  value: a!richTextItem(
                    text: fv!item['recordType!Project.fields.name'],
                    style: "STRONG",
                    size: "MEDIUM"
                  )
                ),
                a!sideBySideLayout(
                  items: {
                    a!sideBySideItem(
                      item: a!richTextDisplayField(
                        value: a!richTextItem(
                          text: fv!item['recordType!Project.fields.status'],
                          color: if(
                            fv!item['recordType!Project.fields.status'] = "Active",
                            "POSITIVE",
                            "SECONDARY"
                          )
                        )
                      )
                    ),
                    a!sideBySideItem(
                      item: a!richTextDisplayField(
                        value: fv!item['recordType!Project.fields.dueDate'],
                        align: "RIGHT"
                      ),
                      width: "MINIMIZE"
                    )
                  }
                )
              },
              link: a!recordLink(
                recordType: 'recordType!Project',
                identifier: fv!item['recordType!Project.fields.id']
              ),
              padding: "STANDARD",
              marginBelow: "STANDARD"
            )
          )
        ),
        stackWhen: { "PHONE", "TABLET_PORTRAIT" }
      )
    )
  ),
  
  local!rows
)`,
        description: "3-column responsive card grid that stacks on small screens"
      }
    ],
    bestPractices: [
      "Use a!columnsLayout with stackWhen for automatic mobile responsiveness",
      "Keep card content concise - title, key metric, status indicator, action link",
      "Use a!cardLayout with link parameter for clickable cards",
      "Add marginBelow for proper spacing between stacked cards on mobile",
      "Limit cards per row to 3-4 on desktop to keep them readable",
      "Use a!stampField or colored richText for visual status indicators"
    ],
    pitfalls: [
      "Not setting stackWhen - cards get squished on mobile instead of stacking",
      "Putting too much content in each card (defeats the purpose of a card layout)",
      "Using fixed pixel widths that break on different screen sizes",
      "Not testing on actual mobile devices (browser resize does not always match)"
    ],
    whenToUse: [
      "Dashboard overview pages with multiple items to browse",
      "Catalog or directory views (products, employees, projects)",
      "Home pages and landing screens",
      "Any list view where visual presentation matters more than data density"
    ],
    whenNotToUse: [
      "Dense data tables where users need to compare many columns",
      "Editable data grids where inline editing is required",
      "Simple list displays with one or two fields (use a!richTextBulletedList)"
    ],
    relatedPatterns: ["sail-wizard", "sail-master-detail"],
    tags: ["interface", "SAIL", "responsive", "cards", "mobile", "layout", "UI"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Cards_Layout.html"
  },
  {
    id: "sail-confirmation-dialog",
    title: "Confirmation Dialog Pattern",
    category: "Interface (SAIL)",
    difficulty: "beginner",
    overview: "Show a confirmation dialog before destructive actions (delete, cancel, reject). Prevents accidental clicks from causing irreversible changes.",
    problem: "Users click Delete or Reject and the action fires immediately. There is no undo in Appian. Accidental clicks on destructive buttons cause data loss, and users learn to distrust the application.",
    solution: "Use a local boolean variable to toggle a confirmation dialog. When the user clicks the destructive button, show a dialog asking them to confirm. Only execute the action when they confirm in the dialog. Use a!buttonWidget with style DESTRUCTIVE for visual clarity.",
    codeExamples: [
      {
        title: "Delete Confirmation Dialog",
        code: `a!localVariables(
  local!showConfirm: false,
  local!deleting: false,
  
  {
    /* Main content */
    a!richTextDisplayField(
      value: "Record: " & ri!record['recordType!Task.fields.title']
    ),
    
    /* Delete button - shows dialog, doesn't delete */
    a!buttonWidget(
      label: "Delete",
      style: "DESTRUCTIVE",
      saveInto: a!save(local!showConfirm, true)
    ),
    
    /* Confirmation Dialog */
    if(local!showConfirm,
      a!cardLayout(
        style: "ERROR",
        contents: {
          a!richTextDisplayField(
            value: {
              a!richTextItem(
                text: "Delete this task?",
                style: "STRONG"
              ),
              char(10),
              a!richTextItem(
                text: "This cannot be undone.",
                color: "SECONDARY"
              )
            }
          ),
          a!columnsLayout(
            columns: {
              a!columnLayout(
                contents: a!buttonWidget(
                  label: "Cancel",
                  style: "SECONDARY",
                  saveInto: a!save(local!showConfirm, false)
                )
              ),
              a!columnLayout(
                contents: a!buttonWidget(
                  label: "Yes, Delete",
                  style: "DESTRUCTIVE",
                  saveInto: {
                    a!save(local!deleting, true),
                    a!deleteRecords(
                      records: ri!record,
                      onSuccess: {
                        a!save(local!deleting, false),
                        a!navigate(
                          link: a!recordTypeLink(
                            recordType: 'recordType!Task'
                          )
                        )
                      },
                      onError: {
                        a!save(local!deleting, false),
                        a!save(local!showConfirm, false)
                      }
                    )
                  },
                  disabled: local!deleting
                )
              )
            }
          )
        },
        padding: "STANDARD",
        marginBelow: "STANDARD"
      ),
      {}
    )
  }
)`,
        description: "Two-step deletion with confirmation dialog"
      }
    ],
    bestPractices: [
      "Always confirm before delete, cancel, reject, or any irreversible action",
      "Use style: DESTRUCTIVE on destructive buttons for visual warning",
      "Show what will be affected in the confirmation message (name, count)",
      "Keep the dialog simple - one question, two buttons (Cancel / Confirm)",
      "Disable the confirm button while the action is processing",
      "Navigate away after successful deletion"
    ],
    pitfalls: [
      "Over-confirming routine actions (save, edit) - only confirm destructive ones",
      "Not telling the user what specifically will be deleted",
      "Forgetting onError handling (dialog stays open, user clicks again)",
      "Using the dialog pattern for complex forms (use a separate form page instead)"
    ],
    whenToUse: [
      "Delete operations on any record",
      "Cancel/withdraw workflows that cannot be restarted",
      "Rejection actions in approval processes",
      "Bulk operations (delete 50 items)",
      "Any action where the user needs to understand the consequences"
    ],
    whenNotToUse: [
      "Save, edit, or create actions (non-destructive)",
      "Actions that can be easily undone (status toggle)",
      "Routine approval actions where speed matters more than caution"
    ],
    relatedPatterns: ["rec-write-back", "sail-editable-grid"],
    tags: ["interface", "SAIL", "dialog", "confirmation", "UX", "destructive-action"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Card_Layout.html"
  },

  // ==================== MORE EXPRESSION RULE PATTERNS ====================
  {
    id: "expr-decision-table",
    title: "Decision Table Pattern",
    category: "Expression Rules",
    difficulty: "intermediate",
    overview: "Replace deeply nested if/else chains with a structured decision table approach using choose(), a!match(), or map-based lookups for complex business logic.",
    problem: "Business logic often involves many conditions: different pricing tiers, approval routing based on amount + department + urgency, or status transitions with multiple criteria. Nested if() statements become unreadable and unmaintainable beyond 3-4 levels.",
    solution: "Model complex decisions as data structures (maps or CDTs) rather than nested code. Use a!match for multi-way branching, choose() for index-based selection, or a!forEach over a rules table to find matching conditions. This separates the decision logic from the rule code.",
    codeExamples: [
      {
        title: "Before - Nested If Hell",
        code: `/* BAD: 4 levels of nesting, hard to modify */
if(ri!amount < 1000,
  if(ri!department = "Engineering",
    cons!APPROVER_ENG_LEAD,
    if(ri!department = "Sales",
      cons!APPROVER_SALES_LEAD,
      cons!APPROVER_DEFAULT
    )
  ),
  if(ri!amount < 10000,
    if(ri!department = "Engineering",
      cons!APPROVER_ENG_DIRECTOR,
      cons!APPROVER_FINANCE_DIRECTOR
    ),
    cons!APPROVER_VP
  )
)`,
        description: "This gets exponentially worse with each new condition"
      },
      {
        title: "After - Decision Table as Data",
        code: `/* GOOD: Decision table - easy to read, modify, and extend */
a!localVariables(
  local!rules: {
    a!map(maxAmount: 1000,  dept: "Engineering", approver: cons!APPROVER_ENG_LEAD),
    a!map(maxAmount: 1000,  dept: "Sales",       approver: cons!APPROVER_SALES_LEAD),
    a!map(maxAmount: 1000,  dept: null,          approver: cons!APPROVER_DEFAULT),
    a!map(maxAmount: 10000, dept: "Engineering", approver: cons!APPROVER_ENG_DIRECTOR),
    a!map(maxAmount: 10000, dept: null,          approver: cons!APPROVER_FINANCE_DIRECTOR),
    a!map(maxAmount: null,  dept: null,          approver: cons!APPROVER_VP)
  },
  
  /* Find first matching rule */
  local!match: displayvalue(
    true,
    a!forEach(
      items: local!rules,
      expression: and(
        or(isnull(fv!item.maxAmount), ri!amount < fv!item.maxAmount),
        or(isnull(fv!item.dept), ri!department = fv!item.dept)
      )
    ),
    property(local!rules, "approver"),
    cons!APPROVER_DEFAULT  /* Fallback */
  ),
  
  local!match
)

/* Using a!match for simpler multi-way branch */
a!match(
  value: ri!status,
  equals: "Draft",    then: "SECONDARY",
  equals: "Active",   then: "POSITIVE",
  equals: "Paused",   then: "ACCENT",
  equals: "Closed",   then: "NEGATIVE",
  default: "STANDARD"
)`,
        description: "Model decisions as data, not nested code"
      }
    ],
    bestPractices: [
      "Use a!match for simple value-to-result mapping (status to color, type to label)",
      "Use a map-based decision table for multi-condition logic (amount + department + priority)",
      "Put the decision table in a separate expression rule so it can be tested independently",
      "Order rules from most specific to least specific (first match wins)",
      "Always include a default/fallback case",
      "Consider storing complex decision tables in a DB table for business-user configurability"
    ],
    pitfalls: [
      "Nesting if() more than 3 levels - refactor to a decision table",
      "Not including a default case (returns null for unexpected inputs)",
      "Putting business logic directly in interfaces instead of expression rules",
      "Making decision rules too granular (one rule per condition) instead of one table"
    ],
    whenToUse: [
      "Approval routing based on multiple criteria",
      "Pricing tier calculations",
      "Status-to-display-property mapping (colors, icons, labels)",
      "Form field visibility rules based on record state",
      "Any branching logic with more than 3 conditions"
    ],
    whenNotToUse: [
      "Simple binary conditions (use if/else)",
      "Logic that requires sequential evaluation with side effects (use a process model)",
      "Conditions that depend on external data at evaluation time (query first, then decide)"
    ],
    relatedPatterns: ["expr-decompose-rules", "expr-compose-rules"],
    tags: ["expression-rules", "decision-table", "logic", "branching", "match", "refactoring"],
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_evaluation_a_match.html"
  },

  // ==================== MORE PROCESS MODEL PATTERNS ====================
  {
    id: "pm-batch-processing",
    title: "Batch Processing Pattern",
    category: "Process Model",
    difficulty: "advanced",
    overview: "Process large datasets in manageable chunks using a looping process model with batch sizes. Handles thousands of records without hitting memory limits or process timeouts.",
    problem: "You need to process 50,000 records (send emails, update statuses, generate documents). Loading all records into a single process variable causes out-of-memory errors. Processing them one at a time takes forever. Appian processes have memory limits and long-running processes can become unresponsive.",
    solution: "Implement a batch processor that queries records in pages (500-1000 at a time), processes each batch, and loops until all records are handled. Use a counter process variable to track progress. Include error handling per batch so one failure does not stop the entire run.",
    codeExamples: [
      {
        title: "Batch Process Model Design",
        code: `/* Process Variables:
   pv!batchSize     = 500 (Integer, default)
   pv!offset        = 0 (Integer)
   pv!totalProcessed = 0 (Integer)
   pv!hasMore       = true (Boolean)
   pv!batchErrors   = {} (List of Map)

   Process Flow:
   
   START
     |
   [Query Batch] -- Script task
     | Query records with paging: startIndex=pv!offset+1, batchSize=pv!batchSize
     | Save results to pv!currentBatch
     | Set pv!hasMore = count(pv!currentBatch) = pv!batchSize
     |
   [Process Batch] -- Subprocess (MNI: run for each item in pv!currentBatch)
     | Each item processed independently
     | Errors caught per item, added to pv!batchErrors
     |
   [Update Counter] -- Script task
     | pv!offset = pv!offset + pv!batchSize
     | pv!totalProcessed = pv!totalProcessed + count(pv!currentBatch)
     | Clear pv!currentBatch (free memory!)
     |
   [Has More?] -- XOR Gateway
     | YES (pv!hasMore = true) --> loop back to [Query Batch]
     | NO --> [Log Results]
     |
   [Log Results] -- Script task
     | Log: pv!totalProcessed records processed
     | Log: count(pv!batchErrors) errors
     |
   END
*/

/* Query Batch - Script Task Expression */
a!queryRecordType(
  recordType: 'recordType!Order',
  filters: a!queryFilter(
    field: 'recordType!Order.fields.status',
    operator: "=",
    value: "Pending"
  ),
  pagingInfo: a!pagingInfo(
    startIndex: pv!offset + 1,
    batchSize: pv!batchSize
  )
).data

/* CRITICAL: Clear batch after processing to free memory */
/* In Update Counter script task: */
/* pv!currentBatch = {} */`,
        description: "Loop through large datasets in chunks without running out of memory"
      }
    ],
    bestPractices: [
      "Use batch sizes of 500-1000 records - balances throughput with memory usage",
      "Clear the batch variable after processing each chunk (pv!currentBatch = {}) to free memory",
      "Track progress with a counter so you can monitor and resume if interrupted",
      "Use asynchronous subprocesses for independent item processing (MNI)",
      "Add error handling per item - do not let one bad record stop the entire batch",
      "Schedule batch jobs during off-hours using a timer start event",
      "Log start time, end time, records processed, and error count for monitoring"
    ],
    pitfalls: [
      "Loading all records into one process variable (out-of-memory on large datasets)",
      "Not clearing the batch variable between iterations (memory leak across loops)",
      "Setting batch size too small (1 record at a time) - process overhead dominates",
      "Not handling errors per item - one failure kills the whole batch",
      "Running batch processes during business hours without throttling"
    ],
    whenToUse: [
      "Bulk email sending (thousands of recipients)",
      "Data migration or transformation of large tables",
      "Periodic cleanup jobs (archive old records, update stale statuses)",
      "Report generation for large datasets",
      "Any operation that touches more than 1000 records"
    ],
    whenNotToUse: [
      "Processing under 100 records (a simple loop is fine)",
      "Real-time operations that need instant results",
      "Operations that must be atomic (all-or-nothing)"
    ],
    relatedPatterns: ["pm-subprocess-reuse", "pm-mni-config", "perf-query-optimization"],
    tags: ["process-model", "batch", "performance", "looping", "large-data", "ETL"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Process_Model_Design_Best_Practices.html"
  },

  // ==================== ADDITIONAL SECURITY PATTERN ====================
  {
    id: "sec-input-validation",
    title: "Input Validation Pattern",
    category: "Security",
    difficulty: "intermediate",
    overview: "Comprehensive input validation strategy combining client-side SAIL validations with server-side process model checks. Defence in depth against bad data and injection attacks.",
    problem: "Developers rely solely on SAIL field validations to protect data quality. But SAIL validations run client-side and can be bypassed. Process models and Web APIs that accept inputs without validation are vulnerable to bad data, SQL injection (in custom SQL queries), and business logic abuse.",
    solution: "Implement validation at three layers: SAIL field validations for instant user feedback, expression rule validators that both SAIL and process models call, and server-side validation in every process model and Web API before writing data.",
    codeExamples: [
      {
        title: "Three-Layer Validation",
        code: `/* Layer 1: SAIL Field Validation (instant feedback) */
a!textField(
  label: "Email",
  value: local!email,
  saveInto: local!email,
  required: true,
  validations: rule!val_email(local!email)
)

/* Layer 2: Shared Validation Rule (reusable) */
/* Expression Rule: rule!val_email(ri!email) */
if(
  isnull(ri!email), "Email is required",
  if(search("@", ri!email) = 0, "Must contain @",
  if(search(".", ri!email) = 0, "Must contain a domain",
  if(len(ri!email) > 254, "Email too long",
  if(search(" ", ri!email) > 0, "Must not contain spaces",
  {}  /* Valid */
))))
)

/* Layer 3: Process Model Validation (server-side gate) */
/* XOR Gateway after Start Node: */
/* Condition: rule!val_isValidSubmission(pv!formData) */

/* Expression Rule: rule!val_isValidSubmission */
and(
  length(rule!val_email(ri!data.email)) = 0,
  length(rule!val_phone(ri!data.phone)) = 0,
  ri!data.amount > 0,
  ri!data.amount < 1000000,
  not(isnull(ri!data.requestType)),
  /* Anti-injection: no SQL keywords in free text fields */
  not(search("DROP TABLE", upper(ri!data.notes)) > 0),
  not(search("DELETE FROM", upper(ri!data.notes)) > 0)
)

/* If validation fails in the process model:
   - Write to error log
   - Send notification to admin
   - End the process gracefully */`,
        description: "Validate at every layer - never trust client-side validation alone"
      }
    ],
    bestPractices: [
      "Write validation logic as expression rules and call them from both SAIL and process models",
      "Validate in the process model even if SAIL already validates (belt and braces)",
      "Use required: true on SAIL fields and validate: true on submit buttons",
      "Sanitise free-text inputs before using in custom SQL (parameterised queries preferred)",
      "Validate data types, ranges, lengths, and formats at every entry point",
      "Log validation failures for security monitoring"
    ],
    pitfalls: [
      "Relying solely on SAIL validations (they can be bypassed)",
      "Duplicating validation logic in SAIL and process models instead of sharing rules",
      "Not validating Web API inputs (external callers can send anything)",
      "Trusting that a dropdown selection is valid (users can manipulate form submissions)",
      "Using string concatenation in custom SQL instead of parameterised queries"
    ],
    whenToUse: [
      "Every application that accepts user input",
      "Forms that write to the database",
      "Web APIs that accept external requests",
      "Processes started by portals or external triggers"
    ],
    whenNotToUse: [
      "Read-only interfaces with no user input",
      "Internal batch processes where data source is trusted and pre-validated"
    ],
    relatedPatterns: ["sec-group-access", "sec-portal", "sail-confirmation-dialog"],
    tags: ["security", "validation", "input", "defence-in-depth", "injection", "forms"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Validation.html"
  }
];
