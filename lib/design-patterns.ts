export interface CodeExample {
  title: string;
  code: string;
  description?: string;
}

export interface DesignPattern {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  overview: string;
  problem: string;
  solution: string;
  codeExamples: CodeExample[];
  bestPractices: string[];
  pitfalls: string[];
  whenToUse: string[];
  whenNotToUse: string[];
  relatedPatterns: string[];
  tags: string[];
  docUrl?: string;
}

export const designPatternCategories = [
  "Process Model",
  "Data Architecture",
  "Interface (SAIL)",
  "Integration",
  "Expression Rules",
  "Security",
  "Portal",
  "Performance",
  "Records & Data",
];

export const designPatterns: DesignPattern[] = [
  // ==================== PROCESS MODEL PATTERNS ====================
  {
    id: "pm-subprocess-reuse",
    title: "Subprocess Reuse Pattern",
    category: "Process Model",
    difficulty: "beginner",
    overview: "Extract common business logic into reusable subprocesses that can be called from multiple parent processes. Reduces duplication and makes maintenance easier.",
    problem: "Multiple process models contain the same sequence of activities (e.g. send notification, update audit log, create task). Changes require updating every copy, leading to inconsistency and bugs.",
    solution: "Create a standalone subprocess for each reusable unit of work. Parent processes call the subprocess node, passing parameters in and receiving outputs. Use asynchronous subprocesses for fire-and-forget work (notifications, logging) and synchronous for work the parent needs to wait on.",
    codeExamples: [
      {
        title: "Subprocess Input - Notification Parameters",
        code: `/* Process Variables for reusable notification subprocess */
pv!recipientUsers    /* List of User */
pv!subject           /* Text */
pv!body              /* Text */  
pv!priority          /* Integer: 1=Low, 2=Normal, 3=High */
pv!relatedRecordId   /* Integer - optional context */

/* The subprocess handles:
   1. Email via Send Email smart service
   2. In-app notification via Send Push Notification
   3. Audit log entry via Write to Data Store */`,
        description: "Define clear process variable contracts for subprocesses"
      },
      {
        title: "Parent Process - Calling the Subprocess",
        code: `/* In the parent process model:
   1. Add a Subprocess node
   2. Select: "Subprocess" → your reusable model
   3. Map process variables:
   
   Input Mapping:
     recipientUsers → pv!approvers
     subject → "Approval Required: " & pv!requestTitle
     body → pv!requestDescription
     priority → 3
     relatedRecordId → pv!requestId
   
   Execution: Asynchronous (don't wait for completion)
*/`,
        description: "Call the subprocess from any parent process"
      }
    ],
    bestPractices: [
      "Name subprocesses with a prefix like 'SUB_' or 'Helper_' for easy identification",
      "Keep subprocess interfaces small - pass only what's needed, not entire CDTs when a few fields suffice",
      "Use asynchronous execution for fire-and-forget tasks (notifications, logging)",
      "Use synchronous execution when the parent needs the subprocess result before continuing",
      "Document the subprocess contract (inputs/outputs) in the description field",
      "Version your subprocesses - don't modify a live subprocess that many processes depend on without testing"
    ],
    pitfalls: [
      "Synchronous subprocesses block the parent - don't use for slow operations unless the parent truly needs to wait",
      "Asynchronous subprocesses run independently - errors won't bubble up to the parent automatically",
      "Too many nested subprocesses make debugging difficult - keep nesting to 2-3 levels max",
      "Process variable type mismatches between parent and subprocess cause runtime errors"
    ],
    whenToUse: [
      "Same sequence of activities appears in 3+ process models",
      "Business logic that changes independently of the calling process",
      "Common operations: notifications, audit logging, data validation, document generation"
    ],
    whenNotToUse: [
      "One-off logic used by a single process - just keep it inline",
      "Very simple operations (single smart service) - the overhead of a subprocess isn't worth it",
      "When you need tight coupling with the parent's exception handling"
    ],
    relatedPatterns: ["pm-error-handling", "pm-write-back"],
    tags: ["process", "subprocess", "reuse", "modularity"],
    docUrl: undefined
  },
  {
    id: "pm-error-handling",
    title: "Exception Flow Error Handling",
    category: "Process Model",
    difficulty: "intermediate",
    overview: "Use exception flows and error-handling nodes to gracefully manage failures in process models. Prevents silent failures and provides structured error recovery.",
    problem: "Integration calls fail, smart services throw errors, and subprocesses crash. Without structured error handling, processes pause silently, leaving users and admins unaware of problems.",
    solution: "Attach exception flows to nodes that can fail (integrations, Write to Data Store, subprocesses). Route exceptions to error-handling logic that logs the error, notifies admins, and either retries or escalates. Use the a!startProcess error handler for interface-initiated processes.",
    codeExamples: [
      {
        title: "Exception Flow - Integration Error Handler",
        code: `/* On the integration node:
   1. Right-click → Add Exception Flow
   2. Connect to an "Assign Error Variables" script task:

   Script Task outputs: */
ac!errorMessage    /* Captured from exception */
ac!errorCode       /* HTTP status or error code */

/* Script Task expression: */
a!localVariables(
  local!errorLog: a!map(
    processId: pp!id,
    processName: pp!name,
    nodeName: "Call External API",
    errorMessage: ac!errorMessage,
    timestamp: now(),
    retryCount: pv!retryCount
  ),
  /* Save to process variable for downstream handling */
  a!save(pv!lastError, local!errorLog)
)

/* 3. After script task → XOR gateway:
   - If retryCount < 3 → Timer (5 min) → Retry integration
   - If retryCount >= 3 → Send Admin Alert subprocess → End */`,
        description: "Structured exception flow with retry logic"
      },
      {
        title: "Interface Error Handling with a!startProcess",
        code: `a!buttonWidget(
  label: "Submit Request",
  saveInto: a!startProcess(
    processModel: cons!SUBMIT_REQUEST_PM,
    processParameters: {
      requestData: local!formData,
      submittedBy: loggedInUser()
    },
    onSuccess: {
      a!save(local!submitted, true),
      a!save(local!message, "Request submitted successfully")
    },
    onError: {
      a!save(local!submitted, false),
      a!save(local!message, "Failed to submit. Please try again or contact support.")
    }
  ),
  style: "PRIMARY"
)`,
        description: "Handle process start failures in the interface"
      }
    ],
    bestPractices: [
      "Every integration node should have an exception flow - external systems fail",
      "Log errors to a data store for monitoring, not just process variables",
      "Include context in error logs: process ID, node name, timestamp, input data",
      "Use retry logic with increasing delays (1 min, 5 min, 15 min) for transient failures",
      "Set maximum retry counts to prevent infinite loops",
      "Send admin notifications only after retry exhaustion, not on every failure"
    ],
    pitfalls: [
      "Catching exceptions silently without logging or alerting - the worst anti-pattern",
      "Retrying non-idempotent operations (e.g. creating duplicate records on retry)",
      "Not testing exception flows - they only fire on errors, which are hard to simulate",
      "Overly complex exception handling that's harder to debug than the original error"
    ],
    whenToUse: [
      "Any process with external integration calls",
      "Smart services that write data (could fail on constraint violations)",
      "Subprocess calls where the child process might fail",
      "Long-running processes where silent failures have business impact"
    ],
    whenNotToUse: [
      "Simple approval workflows with no external dependencies",
      "Processes where failure is acceptable and manually recoverable"
    ],
    relatedPatterns: ["pm-subprocess-reuse", "int-retry-backoff"],
    tags: ["process", "error-handling", "exception", "retry", "resilience"],
    docUrl: undefined
  },
  {
    id: "pm-timer-escalation",
    title: "Timer-Based Escalation",
    category: "Process Model",
    difficulty: "intermediate",
    overview: "Use timer events to automatically escalate tasks that haven't been completed within SLA deadlines. Ensures nothing gets stuck in someone's queue.",
    problem: "User tasks sit unattended. An approval request assigned to a manager goes untouched for days because they're on holiday. No one knows it's stuck until the requestor complains.",
    solution: "Attach timer events to user tasks that fire after an SLA period. The timer triggers an escalation flow: reassign to a backup, notify a supervisor, or auto-approve based on business rules. Use recurring timers for progressive escalation (remind after 1 day, escalate after 3 days).",
    codeExamples: [
      {
        title: "Timer Escalation Configuration",
        code: `/* On the Approval Task node:

   1. Add Timer Event (non-interrupting for reminders):
      - Delay: 24 hours
      - Recurring: Yes (every 24 hours)
      - Flow → Send Reminder Email subprocess
      
   2. Add Timer Event (interrupting for escalation):
      - Delay: 72 hours  
      - Recurring: No
      - Flow → Escalation Script Task:

   Escalation Script Task expression: */
a!localVariables(
  local!supervisor: supervisor(pv!assignee, false),
  local!escalationNote: concat(
    "Task '", pv!taskName, "' has been pending for 3+ days. ",
    "Originally assigned to ", user(pv!assignee, "firstName"), " ",
    user(pv!assignee, "lastName"), ". ",
    "Auto-reassigned to supervisor."
  ),
  {
    /* Reassign the task */
    a!save(pv!assignee, local!supervisor),
    a!save(pv!escalationHistory, 
      append(pv!escalationHistory, a!map(
        from: pv!assignee,
        to: local!supervisor,
        reason: "SLA breach - 72 hours",
        timestamp: now()
      ))
    )
  }
)`,
        description: "Non-interrupting timer for reminders, interrupting timer for escalation"
      }
    ],
    bestPractices: [
      "Use non-interrupting timers for reminders (task stays active), interrupting for reassignment",
      "Make SLA durations configurable via constants, not hardcoded in the process model",
      "Log all escalations for reporting - track SLA compliance over time",
      "Consider business calendars - don't count weekends toward SLA",
      "Progressive escalation: remind → reassign → auto-complete with increasing severity"
    ],
    pitfalls: [
      "Interrupting timers cancel the current task - make sure that's the intended behaviour",
      "Timer delays of less than 1 minute can cause performance issues in high-volume processes",
      "Escalating to a supervisor who is also unavailable - build in fallback logic",
      "Not pausing timers when a process is suspended"
    ],
    whenToUse: [
      "Approval workflows with SLA requirements",
      "Any human task where delays have business impact",
      "Compliance processes with regulatory deadlines",
      "Customer-facing processes where response time matters"
    ],
    whenNotToUse: [
      "System-only processes with no human tasks",
      "Tasks that are genuinely open-ended with no deadline",
      "Low-priority tasks where escalation would create noise"
    ],
    relatedPatterns: ["pm-subprocess-reuse", "pm-mni"],
    tags: ["process", "timer", "escalation", "SLA", "approval"],
    docUrl: undefined
  },
  {
    id: "pm-mni",
    title: "Multiple Node Instance (MNI) Pattern",
    category: "Process Model",
    difficulty: "advanced",
    overview: "Use MNI to create parallel branches that process multiple items simultaneously. Ideal for batch operations like approving multiple line items or processing a list of records.",
    problem: "You need to perform the same operation on a list of items - send approval tasks for 10 line items, call an API for each record in a batch, or generate documents for multiple employees.",
    solution: "Configure a node or subprocess with 'Run as many times as needed' using a process variable list as the driver. Each instance runs independently with its own copy of the loop variable. Collect results back into a list on completion.",
    codeExamples: [
      {
        title: "MNI Subprocess Configuration",
        code: `/* Setup:
   1. Create subprocess: "SUB_ProcessLineItem"
      - Input: pv!lineItem (single CDT)
      - Output: pv!approvalResult (Text: "Approved"/"Rejected")

   2. In parent process, add Subprocess node:
      - Model: SUB_ProcessLineItem
      - Activity chaining: Run as many times as needed
      - Variable: pv!lineItems (List of CDT)
      
   3. Input Mapping:
      lineItem → pv!lineItems  
      (Appian auto-maps each list item to an instance)
      
   4. Output Mapping:
      approvalResult → pv!allResults
      (Results collected into a list matching input order)

   5. After MNI completes, check results: */
a!localVariables(
  local!approved: count(
    where(pv!allResults = "Approved")
  ),
  local!rejected: count(
    where(pv!allResults = "Rejected")  
  ),
  local!allApproved: all(
    fn!exact, 
    a!forEach(pv!allResults, exact(fv!item, "Approved"))
  ),
  /* Route based on aggregate results */
  if(local!allApproved,
    "FULLY_APPROVED",
    "PARTIAL_OR_REJECTED"
  )
)`,
        description: "MNI subprocess for parallel line item approval"
      }
    ],
    bestPractices: [
      "MNI on subprocesses is preferred over MNI on individual nodes - easier to manage",
      "Keep MNI instance count reasonable (under 100) - large counts impact performance",
      "Use the 'run one instance at a time' option for operations that need serialisation",
      "Collect MNI outputs into a list process variable for aggregation after completion",
      "Add error handling within the MNI subprocess - one failing instance shouldn't block others"
    ],
    pitfalls: [
      "MNI on a user task creates N separate tasks - make sure that's intended, not N copies of the same task",
      "Empty input list = zero instances = MNI node completes instantly (this might skip downstream logic unexpectedly)",
      "Memory pressure with very large MNI counts - consider chunking if processing 500+ items",
      "MNI outputs are ordered by completion time, not input order (unless running sequentially)"
    ],
    whenToUse: [
      "Batch processing a list of items with the same logic",
      "Parallel approval of line items in a purchase order",
      "Sending personalised notifications to multiple recipients",
      "Processing records from a query result set"
    ],
    whenNotToUse: [
      "Single items - just use a normal node",
      "Very large lists (1000+) - consider chunked processing instead",
      "When order of execution matters and items depend on each other"
    ],
    relatedPatterns: ["pm-subprocess-reuse", "pm-error-handling"],
    tags: ["process", "MNI", "parallel", "batch", "loop"],
    docUrl: undefined
  },
  {
    id: "pm-write-back",
    title: "Write-Back Pattern",
    category: "Process Model",
    difficulty: "beginner",
    overview: "Use process models to write data back to record types. The standard pattern for creating, updating, and deleting records from interfaces via record actions.",
    problem: "Interfaces (SAIL) are read-heavy by design. You need a way to persist form data, update records after approval, or delete records safely with audit trails.",
    solution: "Create record actions that start process models. The process model receives form data as process variables, performs validation and business logic, then uses Write Records smart service to persist changes. This separates the UI (interface) from the write logic (process).",
    codeExamples: [
      {
        title: "Record Action Process Model",
        code: `/* Process Variables:
   pv!record     (CDT: Employee)   - Input from the form
   pv!isNew      (Boolean)         - Create vs Update
   pv!submitter  (User)            - loggedInUser() from interface

   Node 1: Script Task - Validate & Enrich */
a!localVariables(
  local!now: now(),
  {
    a!save(pv!record.modifiedBy, pv!submitter),
    a!save(pv!record.modifiedOn, local!now),
    if(pv!isNew,
      {
        a!save(pv!record.createdBy, pv!submitter),
        a!save(pv!record.createdOn, local!now),
        a!save(pv!record.status, "Active")
      },
      {}
    )
  }
)

/* Node 2: Write Records Smart Service
   - Record Type: Employee
   - Record: pv!record
   - OnSuccess: End Event
   - OnError: Exception Flow → Log & Alert */`,
        description: "Standard write-back with audit fields"
      },
      {
        title: "Interface Record Action Trigger",
        code: `a!formLayout(
  label: if(ri!isNew, "Create Employee", "Edit Employee"),
  contents: {
    a!textField(
      label: "First Name",
      value: local!record.firstName,
      saveInto: local!record.firstName,
      required: true
    ),
    a!textField(
      label: "Last Name", 
      value: local!record.lastName,
      saveInto: local!record.lastName,
      required: true
    ),
    a!dropdownField(
      label: "Department",
      choiceLabels: cons!DEPARTMENTS,
      choiceValues: cons!DEPARTMENT_IDS,
      value: local!record.departmentId,
      saveInto: local!record.departmentId,
      required: true
    )
  },
  buttons: a!buttonLayout(
    primaryButtons: a!buttonWidget(
      label: "Submit",
      submit: true,
      style: "PRIMARY",
      validate: true
    )
  )
)`,
        description: "Form interface for the record action"
      }
    ],
    bestPractices: [
      "Always add audit fields (createdBy, createdOn, modifiedBy, modifiedOn) in the process",
      "Validate data in the process model, not just the interface - defence in depth",
      "Use record actions (not standalone processes) so they appear on record views",
      "Set the record type as the process model context for better admin visibility",
      "Return meaningful error messages to the interface on failure"
    ],
    pitfalls: [
      "Writing directly from interfaces using a!writeRecords() in saveInto - bypasses process audit trail",
      "Not handling concurrent edits - two users editing the same record simultaneously",
      "Missing error handling on the Write Records node",
      "Forgetting to refresh the record list/view after a successful write"
    ],
    whenToUse: [
      "Any CRUD operation that needs an audit trail",
      "Data changes that trigger downstream business logic (approvals, notifications)",
      "Record actions on record types",
      "Form submissions that modify database records"
    ],
    whenNotToUse: [
      "Read-only displays",
      "Temporary/session-only data (use local variables instead)",
      "Bulk imports - use a dedicated batch process instead"
    ],
    relatedPatterns: ["pm-subprocess-reuse", "sail-wizard", "pm-error-handling"],
    tags: ["process", "write-back", "CRUD", "record-action", "smart-service"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Records_Tutorial.html"
  },

  // ==================== DATA ARCHITECTURE PATTERNS ====================
  {
    id: "data-cdt-normalization",
    title: "CDT Normalisation Pattern",
    category: "Data Architecture",
    difficulty: "intermediate",
    overview: "Design CDTs (Custom Data Types) using database normalisation principles. Separate data into related tables to reduce redundancy, improve integrity, and enable efficient querying via record relationships.",
    problem: "A flat CDT with 30+ fields becomes unwieldy. Repeated data (e.g. department name stored on every employee) wastes space and causes inconsistencies when updated. Reports require complex expressions to aggregate denormalised data.",
    solution: "Split CDTs into normalised tables following 3NF principles. Use foreign key relationships and define record type relationships to enable related record queries. Keep lookup/reference tables separate from transactional data.",
    codeExamples: [
      {
        title: "Normalised CDT Structure",
        code: `/* BEFORE - Flat CDT (anti-pattern): */
type!Employee {
  id, firstName, lastName, email,
  departmentName, departmentCode, departmentManager,
  officeName, officeAddress, officeCity, officeCountry,
  managerFirstName, managerLastName, managerEmail
}

/* AFTER - Normalised CDTs: */
type!Employee {
  id, firstName, lastName, email,
  departmentId,  /* FK → Department */
  officeId,      /* FK → Office */
  managerId      /* FK → Employee (self-referencing) */
}

type!Department {
  id, name, code, managerId  /* FK → Employee */
}

type!Office {
  id, name, address, city, country
}

/* Record Type Relationships:
   Employee → Department (many-to-one via departmentId)
   Employee → Office (many-to-one via officeId)
   Employee → Employee (self-referencing via managerId)
   Department → Employee (one-to-many, reverse of above) */`,
        description: "Split flat CDT into normalised related tables"
      },
      {
        title: "Querying Normalised Data via Relationships",
        code: `/* Query employees with department and office info
   using record type relationships - no joins needed */
a!queryRecordType(
  recordType: recordType!Employee,
  fields: {
    recordType!Employee.fields.firstName,
    recordType!Employee.fields.lastName,
    recordType!Employee.fields.email,
    /* Traverse relationships */
    recordType!Employee.relationships.department.fields.name,
    recordType!Employee.relationships.office.fields.city,
    recordType!Employee.relationships.manager.fields.firstName
  },
  filters: a!queryFilter(
    field: recordType!Employee.relationships.department.fields.name,
    operator: "=",
    value: "Engineering"
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 50)
).data`,
        description: "Related record queries work seamlessly across normalised tables"
      }
    ],
    bestPractices: [
      "Use integer IDs as primary keys, not natural keys (names change, IDs don't)",
      "Define foreign key constraints in the database for data integrity",
      "Create record type relationships matching your FK relationships",
      "Keep lookup tables (Status, Category, Priority) as separate CDTs with constants for code references",
      "Add database indexes on foreign key columns for query performance",
      "Use database views for complex joins that record type relationships can't express"
    ],
    pitfalls: [
      "Over-normalising - splitting into too many tiny tables makes queries complex",
      "Forgetting to index FK columns - causes slow joins",
      "Self-referencing FKs (manager → employee) can cause circular reference issues if not handled carefully",
      "Not defining record relationships - forces manual joins in expressions instead of clean traversal"
    ],
    whenToUse: [
      "Any application with more than 2-3 CDTs",
      "Data that has clear entities with relationships (employees, orders, products)",
      "When you need to report/aggregate across related data",
      "Applications that will grow over time"
    ],
    whenNotToUse: [
      "Simple single-table applications (a to-do list doesn't need normalisation)",
      "Temporary/staging data that will be discarded",
      "Read-heavy dashboards where denormalised views might perform better"
    ],
    relatedPatterns: ["data-views", "data-source-filter"],
    tags: ["data", "CDT", "normalisation", "relationships", "database", "design"],
    docUrl: undefined
  },
  {
    id: "data-source-filter",
    title: "Record Type Source Filters",
    category: "Data Architecture",
    difficulty: "intermediate",
    overview: "Use source filters on record types to restrict which rows are visible to the application. Combine with security rules for defence-in-depth data access control.",
    problem: "A database table contains records from multiple tenants, soft-deleted records, or archived data. You want the record type to only show active, relevant records without requiring filters on every query.",
    solution: "Configure source filters on the record type definition. These filters apply automatically to every query against the record type - no developer can accidentally bypass them. Layer with record-level security for row-level access control.",
    codeExamples: [
      {
        title: "Source Filter Configuration",
        code: `/* On the Record Type configuration:
   
   Source Filters (applied to ALL queries automatically):
   
   1. Soft Delete Filter:
      Field: isDeleted
      Operator: =
      Value: false
   
   2. Tenant Filter (multi-tenant app):
      Field: tenantId  
      Operator: =
      Value: rule!getCurrentTenantId()
   
   3. Active Status Filter:
      Field: status
      Operator: not in
      Value: {"Archived", "Cancelled"}

   These filters are invisible to developers querying the record type.
   a!queryRecordType() calls will NEVER return deleted, 
   wrong-tenant, or archived records regardless of 
   what filters the developer adds. */`,
        description: "Source filters provide automatic, unforgettable data filtering"
      },
      {
        title: "Record-Level Security Expression",
        code: `/* Record-Level Security Rule:
   Configure on the record type under Security.
   
   This expression runs for each record and returns true 
   if the current user should see it. */
   
or(
  /* Admins see everything */
  a!isUserMemberOfGroup(
    loggedInUser(), 
    cons!ADMIN_GROUP
  ),
  
  /* Users see records in their department */
  a!queryRecordType(
    recordType: recordType!Employee,
    filters: a!queryFilter(
      field: recordType!Employee.fields.username,
      operator: "=",
      value: loggedInUser()
    ),
    fields: recordType!Employee.fields.departmentId,
    pagingInfo: a!pagingInfo(1, 1)
  ).data.departmentId = rv!record.departmentId,
  
  /* Record owner always sees their own records */
  rv!record.createdBy = loggedInUser()
)`,
        description: "Row-level security based on user's department and ownership"
      }
    ],
    bestPractices: [
      "Use source filters for universal exclusions (soft deletes, tenant isolation)",
      "Use record-level security for user-specific access control",
      "Source filters on expressions (rule!) re-evaluate on each query - keep them fast",
      "Test source filters by querying as different users to verify correct data isolation",
      "Document which source filters exist on each record type - they're invisible in queries"
    ],
    pitfalls: [
      "Source filters that call slow expressions will slow down every query on that record type",
      "Forgetting that source filters are additive to developer-written filters - can cause confusing 'missing data' bugs",
      "Record-level security expressions that are too complex will timeout",
      "Not indexing columns used in source filters"
    ],
    whenToUse: [
      "Multi-tenant applications sharing a database",
      "Soft-delete pattern (isDeleted flag instead of physical deletion)",
      "Restricting record visibility by user role/department",
      "Filtering out test/staging data in production"
    ],
    whenNotToUse: [
      "Dynamic filters that change based on user input (use query filters instead)",
      "When all records should be visible to all users"
    ],
    relatedPatterns: ["data-cdt-normalization", "sec-group-access"],
    tags: ["data", "security", "source-filter", "multi-tenant", "record-type"],
    docUrl: undefined
  },
  {
    id: "data-views",
    title: "Database Views for Complex Record Types",
    category: "Data Architecture",
    difficulty: "advanced",
    overview: "Use database views as the source for record types when you need complex joins, calculated columns, or aggregations that record type relationships can't express.",
    problem: "You need a record type that combines data from 5+ tables with calculated fields, conditional logic, or aggregations. Record type relationships only support simple FK joins, not complex SQL logic.",
    solution: "Create a database view in your data source that encapsulates the complex query. Point a record type at the view instead of a table. The view handles joins, calculations, and aggregations in SQL while the record type provides the Appian interface.",
    codeExamples: [
      {
        title: "Database View Definition",
        code: `/* SQL View: vw_order_summary */
CREATE VIEW vw_order_summary AS
SELECT 
  o.id AS order_id,
  o.order_date,
  o.status,
  c.id AS customer_id,
  CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
  c.email AS customer_email,
  r.name AS region_name,
  COUNT(oi.id) AS line_item_count,
  SUM(oi.quantity * oi.unit_price) AS order_total,
  SUM(oi.quantity) AS total_units,
  DATEDIFF(CURDATE(), o.order_date) AS days_since_order,
  CASE 
    WHEN o.status = 'Shipped' THEN 'Complete'
    WHEN DATEDIFF(CURDATE(), o.order_date) > 30 THEN 'Overdue'
    ELSE 'On Track'
  END AS health_status
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN regions r ON c.region_id = r.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_date, o.status, 
         c.id, c.first_name, c.last_name, c.email, r.name;

/* Then create a CDT matching the view columns
   and point the Record Type source at the view */`,
        description: "SQL view with joins, aggregations, and calculated fields"
      },
      {
        title: "Record Type on the View",
        code: `/* Record Type Configuration:
   Source: Database → vw_order_summary
   Primary Key: order_id
   
   Now you can query it like any record type: */
a!queryRecordType(
  recordType: recordType!OrderSummary,
  fields: {
    recordType!OrderSummary.fields.customerName,
    recordType!OrderSummary.fields.orderTotal,
    recordType!OrderSummary.fields.healthStatus,
    recordType!OrderSummary.fields.lineItemCount
  },
  filters: a!queryFilter(
    field: recordType!OrderSummary.fields.healthStatus,
    operator: "=",
    value: "Overdue"
  ),
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 20,
    sort: a!sortInfo(
      field: recordType!OrderSummary.fields.orderTotal,
      ascending: false
    )
  )
).data`,
        description: "Query the view-backed record type with full filter/sort support"
      }
    ],
    bestPractices: [
      "Views are read-only - use a separate table-backed record type for writes",
      "Index the underlying tables' join columns for view performance",
      "Keep view logic in SQL, not in Appian expressions - SQL is optimised for this",
      "Name views with a 'vw_' prefix to distinguish from tables",
      "Document the view's SQL in your application documentation",
      "Consider materialised views for very slow aggregations (if your DB supports them)"
    ],
    pitfalls: [
      "Views with many joins and aggregations can be slow - test with production data volumes",
      "Can't use Write Records smart service on view-backed record types",
      "Schema changes to underlying tables can break views silently",
      "Views don't appear in Appian's automatic sync - you may need to manually sync data types"
    ],
    whenToUse: [
      "Dashboard/reporting record types with complex aggregations",
      "Combining data from 4+ tables with calculated fields",
      "When record type relationships can't express the required join logic",
      "Read-only summary views that aggregate transactional data"
    ],
    whenNotToUse: [
      "Simple 1-2 table queries - use record relationships instead",
      "When you need to write data through the record type",
      "When you don't have database admin access to create views"
    ],
    relatedPatterns: ["data-cdt-normalization", "data-source-filter"],
    tags: ["data", "database", "views", "SQL", "performance", "aggregation"],
    docUrl: undefined
  },

  // ==================== INTERFACE (SAIL) PATTERNS ====================
  {
    id: "sail-wizard",
    title: "Multi-Step Wizard Form",
    category: "Interface (SAIL)",
    difficulty: "intermediate",
    overview: "Build a step-by-step form wizard that guides users through complex data entry. Uses local variables to track the current step and validates each step before advancing.",
    problem: "A complex form with 20+ fields overwhelms users. They abandon it or make mistakes because there's too much to process at once. You need progressive disclosure with validation at each step.",
    solution: "Use a local!currentStep variable to control which section is visible. Each step has its own validation. Navigation buttons move between steps, and a progress indicator shows where the user is. Final step shows a review summary before submission.",
    codeExamples: [
      {
        title: "Wizard Framework",
        code: `a!localVariables(
  local!currentStep: 1,
  local!totalSteps: 4,
  local!record: 'type!RequestForm'(),
  local!validationErrors: {},
  
  a!formLayout(
    label: "New Request",
    contents: {
      /* Progress Bar */
      a!richTextDisplayField(
        value: a!forEach(
          items: enumerate(local!totalSteps) + 1,
          expression: {
            a!richTextItem(
              text: choose(fv!item, 
                " 1. Details ", " 2. Items ", 
                " 3. Approval ", " 4. Review "),
              style: if(fv!item = local!currentStep, "STRONG", ""),
              color: if(fv!item <= local!currentStep, 
                "ACCENT", "SECONDARY")
            ),
            if(fv!isLast, {}, 
              a!richTextItem(text: " > ", color: "SECONDARY"))
          }
        )
      ),
      
      /* Step 1: Basic Details */
      a!sectionLayout(
        label: "Request Details",
        contents: {
          a!textField(
            label: "Title",
            value: local!record.title,
            saveInto: local!record.title,
            required: true
          ),
          a!paragraphField(
            label: "Description",
            value: local!record.description,
            saveInto: local!record.description
          )
        },
        showWhen: local!currentStep = 1
      ),
      
      /* Step 2: Line Items */
      a!sectionLayout(
        label: "Line Items",
        contents: { /* editable grid here */ },
        showWhen: local!currentStep = 2
      ),
      
      /* Step 3: Approval Config */
      a!sectionLayout(
        label: "Approval",
        contents: { /* approver picker */ },
        showWhen: local!currentStep = 3
      ),
      
      /* Step 4: Review & Submit */
      a!sectionLayout(
        label: "Review Your Request",
        contents: { /* read-only summary */ },
        showWhen: local!currentStep = 4
      )
    },
    buttons: a!buttonLayout(
      secondaryButtons: a!buttonWidget(
        label: "Back",
        value: local!currentStep - 1,
        saveInto: local!currentStep,
        showWhen: local!currentStep > 1,
        style: "NORMAL"
      ),
      primaryButtons: {
        a!buttonWidget(
          label: "Next",
          value: local!currentStep + 1,
          saveInto: local!currentStep,
          showWhen: local!currentStep < local!totalSteps,
          validate: true,
          style: "PRIMARY"
        ),
        a!buttonWidget(
          label: "Submit",
          submit: true,
          showWhen: local!currentStep = local!totalSteps,
          style: "PRIMARY",
          validate: true
        )
      }
    )
  )
)`,
        description: "Complete wizard with progress bar, step navigation, and validation"
      }
    ],
    bestPractices: [
      "Validate each step independently - don't let users skip ahead with invalid data",
      "Show a progress indicator so users know how many steps remain",
      "Allow backward navigation without losing entered data (local variables persist)",
      "Include a review/summary step before final submission",
      "Keep each step to 3-5 fields maximum for the best user experience",
      "Use showWhen (not if()) to toggle sections - showWhen preserves component state"
    ],
    pitfalls: [
      "Using if() instead of showWhen to toggle steps - if() destroys component state on toggle",
      "Not validating on 'Next' (forgetting validate: true on the Next button)",
      "Too many steps - more than 5-6 steps frustrates users",
      "Not handling browser back button (users expect it to go to the previous step)"
    ],
    whenToUse: [
      "Complex forms with 10+ fields that can be logically grouped",
      "Onboarding flows where each step depends on previous answers",
      "Request forms that need different reviewers based on earlier selections",
      "Any form where progressive disclosure improves the user experience"
    ],
    whenNotToUse: [
      "Simple forms with 3-5 fields - just show everything on one page",
      "Forms where users frequently need to see all fields simultaneously",
      "Mobile-first forms where scroll is more natural than step navigation"
    ],
    relatedPatterns: ["sail-master-detail", "sail-editable-grid", "pm-write-back"],
    tags: ["interface", "SAIL", "wizard", "form", "UX", "progressive-disclosure"],
    docUrl: undefined
  },
  {
    id: "sail-master-detail",
    title: "Master-Detail Layout",
    category: "Interface (SAIL)",
    difficulty: "intermediate",
    overview: "Show a list of records (master) alongside a detail panel that updates when a record is selected. The standard pattern for browse-and-inspect interfaces.",
    problem: "Users need to browse a list of items and view details for each one. Navigating to a separate page for each item is slow and loses context. Users want to stay on one screen.",
    solution: "Use a!columnsLayout with a grid on the left (master) and a detail panel on the right. Clicking a row saves the selected record ID to a local variable, which drives the detail panel content. Use showWhen on the detail panel to hide it until a selection is made.",
    codeExamples: [
      {
        title: "Master-Detail Interface",
        code: `a!localVariables(
  local!selectedId: null,
  local!selectedRecord: if(
    isnull(local!selectedId),
    null,
    a!queryRecordByIdentifier(
      recordType: recordType!Employee,
      identifier: local!selectedId,
      fields: {
        recordType!Employee.fields.firstName,
        recordType!Employee.fields.lastName,
        recordType!Employee.fields.email,
        recordType!Employee.fields.title,
        recordType!Employee.relationships.department.fields.name
      }
    )
  ),
  
  a!columnsLayout(
    columns: {
      /* Master - Record Grid */
      a!columnLayout(
        width: "MEDIUM",
        contents: a!gridField(
          label: "Employees",
          data: a!recordData(
            recordType: recordType!Employee
          ),
          columns: {
            a!gridColumn(
              label: "Name",
              value: fv!row[recordType!Employee.fields.firstName] 
                & " " & fv!row[recordType!Employee.fields.lastName]
            ),
            a!gridColumn(
              label: "Title",
              value: fv!row[recordType!Employee.fields.title]
            )
          },
          selectable: true,
          selectionStyle: "ROW_HIGHLIGHT",
          selectionValue: local!selectedId,
          selectionSaveInto: local!selectedId
        )
      ),
      
      /* Detail Panel */
      a!columnLayout(
        width: "WIDE",
        contents: if(
          isnull(local!selectedId),
          a!richTextDisplayField(
            value: a!richTextItem(
              text: "Select an employee to view details",
              color: "SECONDARY"
            ),
            align: "CENTER"
          ),
          a!sectionLayout(
            label: local!selectedRecord.firstName 
              & " " & local!selectedRecord.lastName,
            contents: {
              a!textField(
                label: "Email",
                value: local!selectedRecord.email,
                readOnly: true
              ),
              a!textField(
                label: "Title",
                value: local!selectedRecord.title,
                readOnly: true
              ),
              a!textField(
                label: "Department",
                value: local!selectedRecord.department.name,
                readOnly: true
              )
            }
          )
        )
      )
    }
  )
)`,
        description: "Grid selection drives the detail panel"
      }
    ],
    bestPractices: [
      "Use grid selection (selectable: true) rather than dynamic links for row selection",
      "Show a placeholder message in the detail panel when nothing is selected",
      "Use a!refreshVariable for the selected record to auto-refresh when the ID changes",
      "Consider a!columnLayout widths: NARROW for master, WIDE for detail on data-heavy views",
      "On mobile, consider switching to a navigation pattern (list → detail page) instead of side-by-side"
    ],
    pitfalls: [
      "Querying full record details on every grid render (use the selection to trigger the detail query)",
      "Not handling the case where the selected record is deleted by another user",
      "Detail panel flickering on selection change - use a!refreshVariable for smooth transitions",
      "Forgetting to clear the selection when data changes"
    ],
    whenToUse: [
      "Browse-and-inspect interfaces (employee directory, order management)",
      "Admin screens where you frequently switch between records",
      "Cases where context (the list) needs to remain visible while viewing details"
    ],
    whenNotToUse: [
      "When detail view requires full-screen space (use record views instead)",
      "Mobile-primary interfaces (side-by-side doesn't work on small screens)",
      "When the list has very few items (just show all details inline)"
    ],
    relatedPatterns: ["sail-wizard", "sail-editable-grid"],
    tags: ["interface", "SAIL", "master-detail", "grid", "layout", "UX"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Columns_Layout.html"
  },
  {
    id: "sail-editable-grid",
    title: "Editable Grid with CRUD",
    category: "Interface (SAIL)",
    difficulty: "advanced",
    overview: "Build an editable grid using a!gridLayout that allows inline create, read, update, and delete of records. More flexible than a!gridField for editing workflows.",
    problem: "Users need to edit multiple rows of data inline (line items on an order, tasks on a project). Opening a dialog for each row is tedious. They want spreadsheet-like inline editing.",
    solution: "Use a!gridLayout with editable components in each cell. Maintain the data in a local variable list. Add row buttons for add/remove. Track which rows are modified for efficient saves. Use a!forEach to render rows dynamically.",
    codeExamples: [
      {
        title: "Editable Grid with Add/Remove",
        code: `a!localVariables(
  local!items: {
    a!map(id: 1, name: "Item A", qty: 1, price: 10.00),
    a!map(id: 2, name: "Item B", qty: 2, price: 25.00)
  },
  
  {
    a!gridLayout(
      label: "Line Items",
      headerCells: {
        a!gridLayoutHeaderCell(label: "Item Name"),
        a!gridLayoutHeaderCell(label: "Quantity", align: "END"),
        a!gridLayoutHeaderCell(label: "Unit Price", align: "END"),
        a!gridLayoutHeaderCell(label: "Total", align: "END"),
        a!gridLayoutHeaderCell(label: "", width: "ICON")
      },
      rows: a!forEach(
        items: local!items,
        expression: a!gridRowLayout(
          id: fv!index,
          contents: {
            a!textField(
              value: fv!item.name,
              saveInto: local!items[fv!index].name,
              required: true
            ),
            a!integerField(
              value: fv!item.qty,
              saveInto: local!items[fv!index].qty,
              required: true,
              align: "END"
            ),
            a!decimalField(
              value: fv!item.price,
              saveInto: local!items[fv!index].price,
              required: true,
              align: "END"
            ),
            a!richTextDisplayField(
              value: a!richTextItem(
                text: fixed(fv!item.qty * fv!item.price, 2),
                style: "STRONG"
              ),
              align: "END"
            ),
            a!richTextDisplayField(
              value: a!richTextItem(
                text: a!richTextIcon(icon: "times", color: "NEGATIVE"),
                link: a!dynamicLink(
                  value: fv!index,
                  saveInto: a!save(
                    local!items,
                    remove(local!items, save!value)
                  )
                )
              )
            )
          }
        )
      ),
      addRowLink: a!dynamicLink(
        label: "+ Add Item",
        value: a!map(
          id: null, 
          name: "", 
          qty: 1, 
          price: 0
        ),
        saveInto: a!save(
          local!items,
          append(local!items, save!value)
        )
      ),
      rowHeader: 1
    ),
    
    /* Total */
    a!richTextDisplayField(
      value: {
        a!richTextItem(text: "Total: ", style: "STRONG"),
        a!richTextItem(
          text: "$" & fixed(
            sum(a!forEach(local!items, fv!item.qty * fv!item.price)),
            2
          ),
          style: "STRONG",
          size: "MEDIUM"
        )
      },
      align: "END"
    )
  }
)`,
        description: "Full CRUD editable grid with calculated totals"
      }
    ],
    bestPractices: [
      "Use a!gridLayout (not a!gridField) for editable grids - gridField is read-only",
      "Always add row IDs to prevent re-render issues when adding/removing rows",
      "Validate individual cells, not just the form as a whole",
      "Show calculated fields (totals, subtotals) as read-only rich text in the grid",
      "Use addRowLink for the add button - it appears consistently at the bottom",
      "Consider maximum row count - very large editable grids are slow"
    ],
    pitfalls: [
      "Not using fv!index for saveInto targeting - saving to the wrong row",
      "Forgetting required:true on mandatory cells - data goes to the process with gaps",
      "Adding too many columns on mobile - grids don't scroll horizontally well",
      "Using a!gridField with selection for editing - it's meant for read-only display"
    ],
    whenToUse: [
      "Line item entry (purchase orders, invoices, timesheets)",
      "Bulk editing of multiple records simultaneously",
      "Any list where users add, edit, and remove items inline",
      "Quick-entry interfaces where dialog-per-row would be too slow"
    ],
    whenNotToUse: [
      "Read-only data display - use a!gridField instead",
      "More than 50 rows - consider pagination or a different pattern",
      "Complex per-row forms - use a dialog or wizard instead of cramming into a grid row"
    ],
    relatedPatterns: ["sail-wizard", "sail-master-detail"],
    tags: ["interface", "SAIL", "grid", "editable", "CRUD", "inline-editing"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Editable_Grid_Component.html"
  },
  {
    id: "sail-dynamic-form",
    title: "Dynamic Form Generation",
    category: "Interface (SAIL)",
    difficulty: "advanced",
    overview: "Generate form fields dynamically based on configuration data rather than hardcoding them. Enables admin-configurable forms without code changes.",
    problem: "Different departments need different fields on the same form. Marketing wants a 'Campaign' field, Finance wants a 'Cost Centre'. Hardcoding each variation creates a maintenance nightmare with dozens of showWhen conditions.",
    solution: "Store field configuration in a data table (field name, type, required, options). Use a!forEach to dynamically render the correct component type for each configured field. Store values in a key-value map rather than typed CDT fields.",
    codeExamples: [
      {
        title: "Dynamic Form from Configuration",
        code: `a!localVariables(
  /* Field config from database or constant */
  local!fieldConfig: {
    a!map(key: "projectName", label: "Project Name", 
          type: "TEXT", required: true),
    a!map(key: "budget", label: "Budget", 
          type: "DECIMAL", required: true),
    a!map(key: "priority", label: "Priority", 
          type: "DROPDOWN", required: true,
          options: {"Low", "Medium", "High", "Critical"}),
    a!map(key: "startDate", label: "Start Date",
          type: "DATE", required: false),
    a!map(key: "notes", label: "Notes", 
          type: "PARAGRAPH", required: false)
  },
  /* Dynamic values stored as key-value map */
  local!formValues: a!map(),
  
  a!forEach(
    items: local!fieldConfig,
    expression: choose(
      wherecontains(
        fv!item.type, 
        {"TEXT","DECIMAL","DROPDOWN","DATE","PARAGRAPH"}
      ),
      /* TEXT */
      a!textField(
        label: fv!item.label,
        value: index(local!formValues, fv!item.key, null),
        saveInto: a!save(
          local!formValues,
          a!update(local!formValues, fv!item.key, save!value)
        ),
        required: fv!item.required
      ),
      /* DECIMAL */
      a!decimalField(
        label: fv!item.label,
        value: index(local!formValues, fv!item.key, null),
        saveInto: a!save(
          local!formValues,
          a!update(local!formValues, fv!item.key, save!value)
        ),
        required: fv!item.required
      ),
      /* DROPDOWN */
      a!dropdownField(
        label: fv!item.label,
        choiceLabels: fv!item.options,
        choiceValues: fv!item.options,
        value: index(local!formValues, fv!item.key, null),
        saveInto: a!save(
          local!formValues,
          a!update(local!formValues, fv!item.key, save!value)
        ),
        required: fv!item.required
      ),
      /* DATE */
      a!dateField(
        label: fv!item.label,
        value: index(local!formValues, fv!item.key, null),
        saveInto: a!save(
          local!formValues,
          a!update(local!formValues, fv!item.key, save!value)
        ),
        required: fv!item.required
      ),
      /* PARAGRAPH */
      a!paragraphField(
        label: fv!item.label,
        value: index(local!formValues, fv!item.key, null),
        saveInto: a!save(
          local!formValues,
          a!update(local!formValues, fv!item.key, save!value)
        ),
        required: fv!item.required
      )
    )
  )
)`,
        description: "Render different field types based on configuration data"
      }
    ],
    bestPractices: [
      "Store field config in a database table so admins can modify without deployments",
      "Use a!map() for form values - it handles dynamic keys better than CDTs",
      "Keep the supported field types limited (5-8 types) to avoid complexity explosion",
      "Add validation rules to the config (min/max length, patterns) for richer forms",
      "Cache the field config with a!refreshVariable to avoid re-querying on every interaction"
    ],
    pitfalls: [
      "Dynamic forms are harder to test - each configuration combination is a test case",
      "Validation is generic, not field-specific - you lose the ability to add custom rules per field",
      "Performance degrades with many dynamic fields (50+) due to forEach evaluation",
      "Storing values as key-value pairs loses type safety - budget stored as text, not decimal"
    ],
    whenToUse: [
      "Admin-configurable forms that change without code deployment",
      "Multi-department forms where each department has different fields",
      "Survey/questionnaire builders where end users define the questions",
      "Forms that evolve frequently and you want configuration over code"
    ],
    whenNotToUse: [
      "Standard forms with fixed, known fields - hardcode them for simplicity",
      "Forms with complex inter-field dependencies (field B required only if field A > 10)",
      "When type safety matters - dynamic forms lose compile-time checks"
    ],
    relatedPatterns: ["sail-wizard", "sail-editable-grid"],
    tags: ["interface", "SAIL", "dynamic", "configuration", "form-builder"],
    docUrl: undefined
  },

  // ==================== INTEGRATION PATTERNS ====================
  {
    id: "int-retry-backoff",
    title: "Retry with Exponential Backoff",
    category: "Integration",
    difficulty: "intermediate",
    overview: "Automatically retry failed integration calls with increasing delay between attempts. Handles transient failures (network blips, rate limits, temporary outages) without manual intervention.",
    problem: "An external API returns a 503 or times out. The process fails permanently even though the API recovers 30 seconds later. Manual retries waste time and don't scale.",
    solution: "Wrap integration calls in a retry loop using a subprocess with a timer. On failure, increment a retry counter, wait an exponentially increasing duration, and try again. Stop after a maximum number of retries and escalate.",
    codeExamples: [
      {
        title: "Retry Subprocess Pattern",
        code: `/* SUB_RetryIntegration Process Variables:
   pv!requestPayload    (Map)      - Input
   pv!responseData      (Map)      - Output
   pv!maxRetries        (Integer)  - Default: 3
   pv!retryCount        (Integer)  - Starts at 0
   pv!lastError         (Text)     - Error message
   pv!succeeded         (Boolean)  - Output flag

   Flow:
   1. [Integration Node] Call External API
      → Success: Set pv!succeeded = true → End
      → Exception Flow: Go to step 2
   
   2. [Script Task] Check Retry
      Expression: */
a!localVariables(
  local!shouldRetry: and(
    pv!retryCount < pv!maxRetries,
    /* Only retry on transient errors */
    or(
      search("503", pv!lastError) > 0,
      search("504", pv!lastError) > 0,
      search("429", pv!lastError) > 0,
      search("timeout", lower(pv!lastError)) > 0,
      search("connection", lower(pv!lastError)) > 0
    )
  ),
  {
    a!save(pv!retryCount, pv!retryCount + 1),
    local!shouldRetry
  }
)

/*   → true: Timer node (delay = 2^retryCount minutes) → Back to step 1
     → false: Set pv!succeeded = false → End

   Timer delay calculation:
   retryCount=1 → 2 min
   retryCount=2 → 4 min  
   retryCount=3 → 8 min */`,
        description: "Process model flow for retry with backoff"
      },
      {
        title: "Expression-Level Retry (for queries)",
        code: `/* For expression-level retries in interfaces,
   use a!refreshVariable with interval: */
a!localVariables(
  local!retryCount: 0,
  local!result: a!refreshVariable(
    value: rule!callExternalApi(ri!params),
    refreshOnInterval: if(
      and(
        isnull(local!result),
        local!retryCount < 3
      ),
      30, /* Retry every 30 seconds if null */
      null /* Stop refreshing on success */
    ),
    refreshOnVarChange: local!retryCount
  ),
  
  if(
    a!isNotNullOrEmpty(local!result),
    /* Display results */
    rule!showResults(local!result),
    /* Show loading/retry state */
    a!richTextDisplayField(
      value: "Loading external data... (attempt " 
        & local!retryCount + 1 & " of 3)"
    )
  )
)`,
        description: "Auto-refresh pattern for interface-level retries"
      }
    ],
    bestPractices: [
      "Only retry on transient errors (5xx, timeout, connection refused) - don't retry 400/401/404",
      "Use exponential backoff to avoid hammering a struggling service",
      "Set a maximum retry count (3-5 is typical) to prevent infinite loops",
      "Log every retry attempt for debugging and monitoring",
      "Make retries idempotent - ensure the operation is safe to repeat",
      "Include the error message in retry logs to identify patterns"
    ],
    pitfalls: [
      "Retrying non-idempotent operations (e.g. creating a record) can cause duplicates",
      "Linear retry (same delay every time) can worsen rate limiting",
      "Not distinguishing between transient and permanent errors",
      "Retry storms - many processes retrying simultaneously overwhelm the external system"
    ],
    whenToUse: [
      "Any external API integration that may experience transient failures",
      "Rate-limited APIs that return 429",
      "Cloud services with occasional 503s during scaling events",
      "File transfer operations that may timeout on large files"
    ],
    whenNotToUse: [
      "Authentication errors (401/403) - retrying won't help, fix the credentials",
      "Validation errors (400) - the request is wrong, not the service",
      "When immediate failure reporting is required"
    ],
    relatedPatterns: ["pm-error-handling", "int-caching"],
    tags: ["integration", "retry", "backoff", "resilience", "error-handling"],
    docUrl: undefined
  },
  {
    id: "int-caching",
    title: "Integration Response Caching",
    category: "Integration",
    difficulty: "intermediate",
    overview: "Cache external API responses in an Appian data table to reduce call volume, improve performance, and provide fallback data when the external service is unavailable.",
    problem: "Every page load calls an external API. With 100 users, you're making 100 identical calls for the same data. This is slow, expensive (API metering), and brittle (any outage breaks all users).",
    solution: "Store API responses in an Appian data table with a timestamp. Before calling the external API, check if cached data exists and is fresh enough. If yes, return the cache. If stale, refresh from the API and update the cache. Use process-based refresh for background updates.",
    codeExamples: [
      {
        title: "Cache-First Query Pattern",
        code: `/* Expression Rule: rule!getCachedOrFresh
   Inputs: ri!cacheKey (Text), ri!maxAgeMinutes (Integer) */
   
a!localVariables(
  /* Check cache first */
  local!cached: a!queryRecordType(
    recordType: recordType!ApiCache,
    filters: {
      a!queryFilter(
        field: recordType!ApiCache.fields.cacheKey,
        operator: "=",
        value: ri!cacheKey
      )
    },
    pagingInfo: a!pagingInfo(1, 1)
  ).data,
  
  local!isFresh: and(
    length(local!cached) > 0,
    todatetime(
      index(local!cached, "updatedAt", null)
    ) > now() - intervalds(0, 0, ri!maxAgeMinutes, 0)
  ),
  
  if(
    local!isFresh,
    /* Return cached data */
    a!fromJson(index(local!cached, "responseJson", "{}")),
    
    /* Cache miss or stale - call the API */
    a!localVariables(
      local!fresh: rule!callExternalApi(ri!cacheKey),
      /* The process model will update the cache async */
      local!fresh
    )
  )
)`,
        description: "Check cache before calling external API"
      },
      {
        title: "Background Cache Refresh Process",
        code: `/* Process Model: PM_RefreshApiCache
   Triggered by: Timer (every 15 min) or on-demand
   
   Node 1: Script Task - Get stale cache entries */
a!queryRecordType(
  recordType: recordType!ApiCache,
  filters: a!queryFilter(
    field: recordType!ApiCache.fields.updatedAt,
    operator: "<",
    value: now() - intervalds(0, 0, 15, 0)
  ),
  pagingInfo: a!pagingInfo(1, 50)
).data

/* Node 2: MNI Subprocess - Refresh each entry
   For each stale entry:
   1. Call the external API
   2. Update the cache record with fresh data + new timestamp
   3. On API failure: keep the stale cache (better than no data)

   Cache table schema:
   api_cache (
     id INT PRIMARY KEY,
     cache_key VARCHAR(255) UNIQUE,
     response_json TEXT,
     updated_at TIMESTAMP,
     ttl_minutes INT DEFAULT 15
   ) */`,
        description: "Background process to keep cache fresh"
      }
    ],
    bestPractices: [
      "Set TTL (time-to-live) based on how often the external data changes",
      "Use background processes for cache refresh, not user-triggered calls",
      "Return stale data on API failure rather than showing an error (stale > nothing)",
      "Use the cache key pattern: 'service:endpoint:params' for granular caching",
      "Monitor cache hit rates to tune TTL values",
      "Clear the cache when you know data has changed (webhooks, manual trigger)"
    ],
    pitfalls: [
      "Cache invalidation is hard - stale data can cause business problems if TTL is too long",
      "Caching user-specific data without including the user in the cache key",
      "Not handling cache table growth - add a cleanup process for expired entries",
      "Caching error responses - only cache successful API responses"
    ],
    whenToUse: [
      "Reference data that changes infrequently (exchange rates, product catalogues)",
      "Expensive API calls (per-call pricing, slow responses)",
      "High-traffic interfaces where many users need the same data",
      "Providing resilience against external service outages"
    ],
    whenNotToUse: [
      "Real-time data where staleness is unacceptable (live stock prices, fraud detection)",
      "User-specific data that varies per request",
      "Write operations (only cache reads, never writes)"
    ],
    relatedPatterns: ["int-retry-backoff", "pm-subprocess-reuse"],
    tags: ["integration", "caching", "performance", "resilience", "TTL"],
    docUrl: undefined
  },

  // ==================== EXPRESSION RULE PATTERNS ====================
  {
    id: "expr-helper-composition",
    title: "Helper Rule Composition",
    category: "Expression Rules",
    difficulty: "beginner",
    overview: "Break complex expressions into small, reusable helper rules that compose together. Each rule does one thing well, and complex logic is built by combining simple rules.",
    problem: "A single expression rule has grown to 100+ lines with nested if/and/or statements. It's impossible to test, debug, or modify without breaking something. New team members can't understand it.",
    solution: "Extract logical units into named helper rules. Each rule should be testable independently with clear inputs and outputs. Complex rules become compositions of simple ones. Use a naming convention like 'util_' or 'helper_' for reusable utility rules.",
    codeExamples: [
      {
        title: "Before - Monolithic Rule",
        code: `/* DON'T DO THIS - one giant rule */
if(
  and(
    a!isNotNullOrEmpty(ri!employee.departmentId),
    or(
      a!isUserMemberOfGroup(loggedInUser(), cons!HR_GROUP),
      a!isUserMemberOfGroup(loggedInUser(), cons!ADMIN_GROUP),
      exact(
        user(loggedInUser(), "supervisorId"),
        ri!employee.managerId
      )
    ),
    ri!employee.status = "Active",
    todatetime(ri!employee.startDate) < now() - intervalds(90, 0, 0, 0)
  ),
  /* ...100 more lines of nested logic... */
)`,
        description: "Hard to read, test, or maintain"
      },
      {
        title: "After - Composed Helper Rules",
        code: `/* rule!util_isHROrAdmin */
or(
  a!isUserMemberOfGroup(loggedInUser(), cons!HR_GROUP),
  a!isUserMemberOfGroup(loggedInUser(), cons!ADMIN_GROUP)
)

/* rule!util_isDirectManager(ri!employeeManagerId) */
exact(
  user(loggedInUser(), "supervisorId"),
  ri!employeeManagerId
)

/* rule!util_hasCompletedProbation(ri!startDate) */
todatetime(ri!startDate) < now() - intervalds(90, 0, 0, 0)

/* rule!canViewEmployeeDetails(ri!employee) 
   — the composed rule, now readable */
and(
  a!isNotNullOrEmpty(ri!employee.departmentId),
  or(
    rule!util_isHROrAdmin(),
    rule!util_isDirectManager(ri!employee.managerId)
  ),
  ri!employee.status = "Active",
  rule!util_hasCompletedProbation(ri!employee.startDate)
)`,
        description: "Small, testable, composable rules"
      }
    ],
    bestPractices: [
      "Name rules by what they answer: 'canView...', 'isValid...', 'get...'",
      "Each helper should be testable with a few input combinations",
      "Use a consistent prefix: 'util_' for utilities, 'calc_' for calculations, 'fmt_' for formatting",
      "Keep helper rules pure - no side effects, just inputs → output",
      "Document each rule's purpose in its description field",
      "Group related helpers in the same folder"
    ],
    pitfalls: [
      "Over-decomposing - don't create a rule for a single line of code",
      "Deeply nested rule calls (rule calling rule calling rule 5 levels deep) are hard to debug",
      "Not documenting which rules depend on each other",
      "Inconsistent naming makes discovery difficult"
    ],
    whenToUse: [
      "Any expression rule over 30 lines",
      "Logic that appears in multiple rules or interfaces",
      "Security checks (isAdmin, canEdit, hasPermission)",
      "Calculations reused across the application (formatCurrency, calculateAge)"
    ],
    whenNotToUse: [
      "Trivial expressions (2-3 lines) that are used once",
      "When the overhead of navigating between rules outweighs the readability benefit"
    ],
    relatedPatterns: ["expr-guard-clause"],
    tags: ["expression", "composition", "reuse", "clean-code", "maintainability"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Expressions.html"
  },
  {
    id: "expr-guard-clause",
    title: "Guard Clause Pattern",
    category: "Expression Rules",
    difficulty: "beginner",
    overview: "Handle edge cases and invalid inputs at the top of an expression rule before processing the main logic. Reduces nesting and makes the 'happy path' clear.",
    problem: "Expression rules with deeply nested if() statements to handle null values, empty lists, invalid inputs, and edge cases. The actual business logic is buried under layers of defensive checks.",
    solution: "Check for invalid/edge-case inputs first and return early. Only proceed to the main logic after all guards pass. This keeps the main logic at the top level (no deep nesting) and makes edge case handling explicit.",
    codeExamples: [
      {
        title: "Before - Deeply Nested Checks",
        code: `/* DON'T DO THIS */
if(
  a!isNotNullOrEmpty(ri!items),
  if(
    length(ri!items) > 0,
    if(
      a!isNotNullOrEmpty(ri!taxRate),
      if(
        ri!taxRate >= 0,
        /* FINALLY - the actual calculation buried 4 levels deep */
        sum(a!forEach(ri!items, fv!item.price * fv!item.qty)) 
          * (1 + ri!taxRate),
        0
      ),
      sum(a!forEach(ri!items, fv!item.price * fv!item.qty))
    ),
    0
  ),
  0
)`,
        description: "Nested defensive checks obscure the logic"
      },
      {
        title: "After - Guard Clauses",
        code: `/* rule!calc_orderTotal(ri!items, ri!taxRate) */
a!localVariables(
  /* Guard 1: No items */
  local!hasItems: a!isNotNullOrEmpty(ri!items),
  
  /* Guard 2: Valid tax rate */
  local!effectiveTaxRate: if(
    and(
      a!isNotNullOrEmpty(ri!taxRate),
      ri!taxRate >= 0
    ),
    ri!taxRate,
    0
  ),
  
  /* Early returns for guard failures */
  if(not(local!hasItems), 0,
  
  /* Main logic - clean and flat */
  a!localVariables(
    local!subtotal: sum(
      a!forEach(ri!items, fv!item.price * fv!item.qty)
    ),
    round(local!subtotal * (1 + local!effectiveTaxRate), 2)
  ))
)`,
        description: "Guards at the top, main logic uncluttered"
      }
    ],
    bestPractices: [
      "Check for null/empty inputs first, then type validity, then business rules",
      "Return sensible defaults for edge cases (0 for calculations, empty list for arrays)",
      "Use a!defaultValue() for simple null guards: a!defaultValue(ri!taxRate, 0)",
      "Keep guard clauses as simple one-line checks",
      "Document what each guard protects against"
    ],
    pitfalls: [
      "Returning null from guards when the caller expects a typed result (causes downstream nulls)",
      "Silently swallowing errors - sometimes you should raise an error() instead of returning a default",
      "Too many guards can indicate the function is doing too much - consider splitting"
    ],
    whenToUse: [
      "Any rule that handles nullable inputs",
      "Calculations where division by zero or empty list are possible",
      "Rules called from multiple contexts where input quality varies",
      "Complex rules where the happy path is being obscured by defensive code"
    ],
    whenNotToUse: [
      "Rules with guaranteed non-null inputs (e.g. system-generated values)",
      "When the guard condition IS the business logic (not a precondition)"
    ],
    relatedPatterns: ["expr-helper-composition"],
    tags: ["expression", "guard-clause", "clean-code", "null-handling", "readability"],
    docUrl: "https://docs.appian.com/suite/help/25.4/Expressions.html"
  },

  // ==================== SECURITY PATTERNS ====================
  {
    id: "sec-group-access",
    title: "Group-Based Access Control",
    category: "Security",
    difficulty: "intermediate",
    overview: "Use Appian groups as the foundation for all access control. Define groups by role (Admin, Manager, User) and reference them consistently across records, processes, interfaces, and documents.",
    problem: "Access control is scattered. Some interfaces check user names, some check groups, some have no checks. When someone changes role, you update 15 different places and miss two. Security is inconsistent and auditable.",
    solution: "Create a group hierarchy reflecting your organisational roles. Store group references as constants. Use these constants everywhere: record security, process permissions, interface visibility, document folder security. One group change propagates everywhere.",
    codeExamples: [
      {
        title: "Group Hierarchy Design",
        code: `/* Application Group Hierarchy:
   
   GRP_AllUsers (top-level)
   ├── GRP_Admins (system administrators)
   ├── GRP_Managers (department managers)
   │   ├── GRP_HR_Managers
   │   ├── GRP_Finance_Managers
   │   └── GRP_Engineering_Managers
   └── GRP_Users (standard users)
       ├── GRP_HR_Users
       ├── GRP_Finance_Users
       └── GRP_Engineering_Users

   Constants:
   cons!GRP_ADMINS → Group ID for GRP_Admins
   cons!GRP_MANAGERS → Group ID for GRP_Managers
   cons!GRP_USERS → Group ID for GRP_Users
   cons!GRP_ALL → Group ID for GRP_AllUsers
   
   Rule: Admins inherit Manager permissions.
   Managers inherit User permissions.
   Check from most specific to least. */`,
        description: "Hierarchical group structure"
      },
      {
        title: "Consistent Security Checks",
        code: `/* rule!sec_isAdmin() */
a!isUserMemberOfGroup(loggedInUser(), cons!GRP_ADMINS)

/* rule!sec_isManagerOrAbove() */
or(
  rule!sec_isAdmin(),
  a!isUserMemberOfGroup(loggedInUser(), cons!GRP_MANAGERS)
)

/* rule!sec_canEditRecord(ri!record) */
or(
  rule!sec_isAdmin(),
  and(
    rule!sec_isManagerOrAbove(),
    ri!record.departmentId = rule!getCurrentUserDepartmentId()
  ),
  ri!record.createdBy = loggedInUser()
)

/* Usage in interface: */
a!buttonWidget(
  label: "Edit",
  showWhen: rule!sec_canEditRecord(local!record),
  /* ... */
)

/* Usage in process: */
/* Swimlane assigned to: cons!GRP_MANAGERS */

/* Usage in record security: */
/* Record-level security rule: rule!sec_canEditRecord(rv!record) */`,
        description: "One set of rules used everywhere"
      }
    ],
    bestPractices: [
      "Define all groups at application setup, not ad-hoc during development",
      "Store group IDs as constants - never hardcode group IDs in expressions",
      "Create security helper rules (sec_isAdmin, sec_canEdit) and reuse them everywhere",
      "Use group hierarchy so admins automatically inherit lower-level permissions",
      "Test security by logging in as users in different groups",
      "Document the group structure and what each group can do"
    ],
    pitfalls: [
      "Checking usernames instead of groups - breaks when users change roles",
      "Creating too many groups (one per user) instead of role-based groups",
      "Not setting default security on new objects - they may be wide open",
      "Inconsistent group checks across interfaces, processes, and records"
    ],
    whenToUse: [
      "Every Appian application should use group-based security",
      "Multi-role applications (admin, manager, user)",
      "Multi-department applications where data visibility varies",
      "Applications with audit requirements for access control"
    ],
    whenNotToUse: [
      "Personal-use applications with a single user (rare in Appian)",
      "Public portals where all data is visible to all (still use groups for admin functions)"
    ],
    relatedPatterns: ["data-source-filter", "sec-portal"],
    tags: ["security", "groups", "RBAC", "access-control", "permissions"],
    docUrl: undefined
  },

  // ==================== PORTAL PATTERNS ====================
  {
    id: "sec-portal",
    title: "Portal Security Pattern",
    category: "Portal",
    difficulty: "advanced",
    overview: "Design secure Appian Portals (public-facing interfaces) using the service account model. Portals run as a system user, requiring careful data exposure controls.",
    problem: "Portals are accessed by anonymous external users but need to read/write Appian data. The portal runs as a service account with elevated privileges. Without careful design, you could expose internal data or allow unauthorized writes.",
    solution: "Create a dedicated service account with minimal permissions. Use record types with source filters to limit visible data. Validate all portal inputs server-side. Use reCAPTCHA to prevent abuse. Separate public-facing record types from internal ones.",
    codeExamples: [
      {
        title: "Portal Architecture",
        code: `/* Portal Security Layers:

   1. Service Account: 'portal.service.account'
      - Member of: GRP_Portal_ServiceAccount (minimal group)
      - NOT member of: any internal groups
      - Access: Only portal-specific record types

   2. Portal-Specific Record Types:
      - RT_PublicJob (source: vw_public_jobs view)
        → Only shows approved, active job listings
        → Source filter: status = 'Published'
        → No internal fields (salary range, hiring manager notes)
      
   3. Portal Write Pattern:
      - All writes go through a process model
      - Process validates input before writing
      - Rate limiting via tracking table

   4. reCAPTCHA on all form submissions */

/* Portal Interface - Job Application */
a!localVariables(
  local!application: a!map(
    name: "",
    email: "",
    jobId: ri!jobId,
    resumeDoc: null
  ),
  local!captchaValid: false,
  local!submitted: false,
  
  if(local!submitted,
    /* Thank you message */
    a!richTextDisplayField(
      value: a!richTextItem(
        text: "Application submitted. We will be in touch.",
        size: "MEDIUM"
      )
    ),
    /* Application form */
    {
      a!textField(
        label: "Full Name",
        value: local!application.name,
        saveInto: local!application.name,
        required: true
      ),
      a!textField(
        label: "Email",
        value: local!application.email,
        saveInto: local!application.email,
        required: true,
        validations: if(
          search("@", local!application.email) = 0,
          "Please enter a valid email address",
          null
        )
      ),
      /* reCAPTCHA component */
      a!verifyRecaptcha(
        onSuccess: a!save(local!captchaValid, true)
      ),
      a!buttonWidget(
        label: "Submit Application",
        disabled: not(local!captchaValid),
        saveInto: a!startProcess(
          processModel: cons!PM_PORTAL_APPLICATION,
          processParameters: {
            application: local!application
          },
          onSuccess: a!save(local!submitted, true)
        ),
        style: "PRIMARY",
        validate: true
      )
    }
  )
)`,
        description: "Secure portal form with reCAPTCHA and process-based writes"
      }
    ],
    bestPractices: [
      "Create a dedicated service account for portals - don't reuse internal accounts",
      "Give the service account the absolute minimum permissions needed",
      "Use database views for portal record types - expose only public fields",
      "Validate ALL inputs in the process model, not just the interface",
      "Add reCAPTCHA to every portal form submission",
      "Rate-limit submissions per IP/session to prevent abuse",
      "Use a!pageResponse for SEO-friendly portal pages"
    ],
    pitfalls: [
      "Service account with admin privileges - a portal exploit could access everything",
      "Exposing internal record types to the portal - use dedicated portal-specific types",
      "Not validating email/phone format server-side - portal inputs are untrusted",
      "Forgetting that portal users can manipulate the URL and query parameters",
      "Not testing the portal as an anonymous user"
    ],
    whenToUse: [
      "Public-facing job boards, application forms, customer portals",
      "Self-service portals for external users (status checks, submissions)",
      "Marketing landing pages with form submissions",
      "Any interface that needs to be accessible without an Appian login"
    ],
    whenNotToUse: [
      "Internal-only applications - use standard Appian sites",
      "When you need full Appian authentication features",
      "High-security applications where public access is inappropriate"
    ],
    relatedPatterns: ["sec-group-access", "pm-write-back"],
    tags: ["portal", "security", "public", "external", "reCAPTCHA", "service-account"],
    docUrl: undefined
  },

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
    title: "Refresh Variable Strategy",
    category: "Performance",
    difficulty: "intermediate",
    overview: "Use a!refreshVariable to control when local variables re-evaluate in interfaces. Prevent unnecessary queries on every user interaction by defining explicit refresh conditions.",
    problem: "By default, local variables in a!localVariables re-evaluate whenever their dependencies change. On complex interfaces, a query or integration call can re-fire on every keystroke, dropdown change, or unrelated interaction - hammering the database and making the UI sluggish.",
    solution: "Wrap expensive local variables in a!refreshVariable to control exactly when they re-evaluate. Use refreshInterval for polling, refreshOnVarChange to re-query only when a specific filter changes, refreshAfter for re-querying after a save action, and refreshAlways: false to prevent re-evaluation on unrelated interactions.",
    codeExamples: [
      {
        title: "Refresh on Interval (Dashboard Polling)",
        code: `a!localVariables(
  /* Re-query every 60 seconds instead of on every interaction */
  local!activeCases: a!refreshVariable(
    value: a!queryRecordType(
      recordType: recordType!Case,
      filters: a!queryFilter(
        field: recordType!Case.fields.status,
        operator: "=",
        value: "Open"
      ),
      pagingInfo: a!pagingInfo(1, 20)
    ).data,
    refreshInterval: 60
  ),
  /* Interface uses local!activeCases */
  a!gridField(
    data: local!activeCases
  )
)`,
        description: "Poll for fresh data at a fixed interval instead of re-querying on every interaction"
      },
      {
        title: "Refresh When a Filter Changes",
        code: `a!localVariables(
  local!selectedStatus: "Open",
  
  /* Only re-query when local!selectedStatus changes */
  local!cases: a!refreshVariable(
    value: a!queryRecordType(
      recordType: recordType!Case,
      filters: a!queryFilter(
        field: recordType!Case.fields.status,
        operator: "=",
        value: local!selectedStatus
      ),
      pagingInfo: a!pagingInfo(1, 50)
    ).data,
    refreshOnVarChange: local!selectedStatus
  ),
  
  {
    a!dropdownField(
      label: "Status",
      choiceLabels: { "Open", "Closed", "Pending" },
      choiceValues: { "Open", "Closed", "Pending" },
      value: local!selectedStatus,
      saveInto: local!selectedStatus
    ),
    a!gridField(data: local!cases)
  }
)`,
        description: "Re-query only when the relevant filter variable changes, not on every interaction"
      },
      {
        title: "Refresh After a Save Action",
        code: `a!localVariables(
  local!refreshTrigger: 0,
  
  /* Re-query after the user saves a new record */
  local!records: a!refreshVariable(
    value: a!queryRecordType(
      recordType: recordType!Task,
      pagingInfo: a!pagingInfo(1, 50)
    ).data,
    refreshAfter: local!refreshTrigger
  ),
  
  {
    a!gridField(data: local!records),
    a!buttonWidget(
      label: "Save New Task",
      saveInto: {
        a!writeRecords(records: recordType!Task, /* ... */),
        /* Increment the trigger to force a refresh */
        a!save(local!refreshTrigger, local!refreshTrigger + 1)
      }
    )
  }
)`,
        description: "Force a re-query after a write operation completes"
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
      "Use refreshOnVarChange to tie queries to specific filter variables instead of re-running on every interaction",
      "Use refreshInterval for dashboard-style polling - keeps data fresh without user action",
      "Use refreshAfter to re-query data after a write operation (save, delete, update)",
      "Combine a!refreshVariable with a!localVariables to store expensive results and reference them multiple times",
      "Set refreshAlways: false on variables that should only evaluate once when the interface loads"
    ],
    pitfalls: [
      "Not using refreshOnVarChange and letting queries fire on every unrelated interaction",
      "Setting refreshInterval too low (e.g. 1 second) - creates unnecessary server load",
      "Forgetting that refreshOnVarChange tracks the variable reference, not the value - use the variable directly, not an expression",
      "Using refreshAlways: true when you actually need refreshOnVarChange - refreshAlways re-evaluates on every interaction"
    ],
    whenToUse: [
      "Interfaces with expensive queries that don't need to update on every interaction",
      "Dashboard polling (refreshInterval) for near-real-time data",
      "Forms where a query depends on a specific filter or selection (refreshOnVarChange)",
      "Re-fetching data after a save/delete action (refreshAfter)"
    ],
    whenNotToUse: [
      "Simple interfaces with a single query and no user interactions",
      "Variables that genuinely need to re-evaluate on every change (calculated fields, formatting)",
      "When the default refresh behaviour already works correctly"
    ],
    relatedPatterns: ["perf-query-optimization"],
    tags: ["performance", "refresh", "a!refreshVariable", "interfaces", "optimization"],
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_evaluation_a_refreshvariable.html"
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
    relatedPatterns: ["rec-write-back", "perf-query-optimization", "data-cdt-normalization"],
    tags: ["records", "aggregation", "relationships", "dashboard", "queries", "reporting"],
    docUrl: undefined
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
    docUrl: undefined
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
    relatedPatterns: ["int-retry-backoff", "int-caching"],
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
    relatedPatterns: ["int-retry-backoff", "int-webhook-receiver", "pm-error-handling"],
    tags: ["integration", "logging", "monitoring", "error-handling", "admin", "observability"],
    docUrl: undefined
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
    docUrl: undefined
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
    docUrl: undefined
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
    relatedPatterns: ["expr-helper-composition", "expr-guard-clause"],
    tags: ["expression-rules", "decision-table", "logic", "branching", "match", "refactoring"],
    docUrl: undefined
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
    relatedPatterns: ["pm-subprocess-reuse", "pm-mni", "perf-query-optimization"],
    tags: ["process-model", "batch", "performance", "looping", "large-data", "ETL"],
    docUrl: undefined
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
    docUrl: undefined
  }
];
