export interface ChecklistItem {
  id: string;
  text: string;
  detail?: string;
  docUrl?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  frequency: string;
  items: ChecklistItem[];
}

export const checklistSections: ChecklistSection[] = [
  {
    id: "general",
    title: "General",
    icon: "🔒",
    description: "Security, naming conventions, and application health",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "gen-1",
        text: "Application security summary reviewed for every object",
        detail: "Check the security summary in Appian Designer for each object to ensure proper access controls.",
      },
      {
        id: "gen-2",
        text: "Unique PREFIX and object naming convention defined and observed",
        detail: "Each application should have a unique prefix (e.g. HR_, FIN_) applied consistently to all objects.",
        docUrl: "https://docs.appian.com/suite/help/latest/Standard_Object_Names.html",
      },
      {
        id: "gen-3",
        text: "All objects have useful names and descriptions with inline comments",
        detail: "Names should be descriptive. Use inline comments to explain complex code blocks.",
      },
      {
        id: "gen-4",
        text: "PREFIX Viewers, Designers, and Administrators groups created and used",
        detail: "Create standard groups for each application: PREFIX Viewers (or Users), PREFIX Designers, PREFIX Administrators.",
      },
      {
        id: "gen-5",
        text: "All objects have proper security settings",
        detail: "PREFIX Administrators = Administrator, PREFIX Users = Viewer, all other users = no access by default.",
      },
      {
        id: "gen-6",
        text: "Health Dashboard contains no warnings or recommendations",
        detail: "Check the Appian Health Dashboard regularly and address all findings.",
      },
      {
        id: "gen-7",
        text: "Appian Health Check results reviewed and addressed each sprint",
        detail: "Run Appian Health Check as part of each sprint and resolve all findings.",
        docUrl: "https://docs.appian.com/suite/help/23.3/health-check.html",
      },
    ],
  },
  {
    id: "record-types",
    title: "Record Types",
    icon: "📊",
    description: "Record-centric design, data sync, and security",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "rt-1",
        text: "Application is built as record-centric",
        detail: "Record types should represent business entities and be the foundation of your application architecture.",
      },
      {
        id: "rt-2",
        text: "Record types have data sync enabled whenever possible",
        detail: "Data sync improves performance by caching data locally. Enable it unless there's a specific reason not to.",
      },
      {
        id: "rt-3",
        text: "Domain model designed as record types with relationships",
        detail: "Define relationships between record types to model your business domain properly.",
      },
      {
        id: "rt-4",
        text: "Record-level security rules configured with constants",
        detail: "Use record-level security when appropriate. Use constants instead of hard-coding condition criteria.",
      },
      {
        id: "rt-5",
        text: "Search box configured with explicit field list and custom placeholder",
        detail: "When enabling 'Show search box', explicitly configure which fields to search and keep the list minimal. Add custom placeholder text.",
      },
    ],
  },
  {
    id: "interfaces",
    title: "Interfaces & Expression Rules",
    icon: "🖥️",
    description: "SAIL best practices, performance, and testing",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "int-1",
        text: "No queries/integrations in always-refreshing local variables",
        detail: "Queries and integration rules should not be called as local variables that refresh always or on short intervals.",
      },
      {
        id: "int-2",
        text: "All queries use explicit PagingInfo with batchsize (never -1)",
        detail: "Always specify a batchsize in PagingInfo. Using -1 loads all records which can cause performance issues.",
      },
      {
        id: "int-3",
        text: "Only necessary data is queried (no excess data in memory)",
        detail: "Query only the fields and records needed. Don't pull entire datasets when you need a subset.",
      },
      {
        id: "int-4",
        text: "No looping over queries or integrations",
        detail: "Avoid calling queries/integrations inside loops. Pay close attention when building grids or record lists.",
      },
      {
        id: "int-5",
        text: "Interfaces and expression rules open without errors",
        detail: "Verify all interfaces open cleanly in Interface Designer with no error banners.",
      },
      {
        id: "int-6",
        text: "Interfaces have useful test inputs saved as Default",
        detail: "Save meaningful default test inputs so reviewers can evaluate the interface immediately.",
      },
      {
        id: "int-7",
        text: "Expression rules have 2+ test cases (null inputs + functional)",
        detail: "At minimum: one test with NULL inputs and one satisfying a functional use case.",
      },
      {
        id: "int-8",
        text: "Rules invoked using keyword syntax",
        detail: "Use keyword syntax for function parameters: e.g. textInput: someValue instead of positional arguments.",
      },
      {
        id: "int-9",
        text: "Rules are properly formatted and readable",
        detail: "Code should be well-indented and easy to follow. Use line breaks for readability.",
      },
      {
        id: "int-10",
        text: "Inline SAIL comments for every major code change",
        detail: "Use format: /* STORY_NUMBER: meaning of the code change */ for all significant changes.",
      },
      {
        id: "int-11",
        text: "Recursive rules have termination conditions and unit tests",
        detail: "Ensure recursion cannot be infinite. Add test cases covering all permutations.",
      },
      {
        id: "int-12",
        text: "SAIL interfaces compatible with automated functional testing",
        detail: "Follow SAIL design best practices for FitNesse for Appian compatibility.",
      },
    ],
  },
  {
    id: "constants",
    title: "Constants",
    icon: "🔢",
    description: "Naming, documentation, and reuse",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "const-1",
        text: "Constant value documented in description",
        detail: "Example: PREFIX_STATUS_VALID - 'Represents the value of status VALID for application PREFIX'.",
      },
      {
        id: "const-2",
        text: "Constants used whenever a value is repeated",
        detail: "Any value used more than once should be extracted to a constant. No magic strings or numbers.",
      },
      {
        id: "const-3",
        text: "No duplicate constants (one constant per unique value)",
        detail: "Audit for duplicate constants. Each unique value should have exactly one constant.",
      },
    ],
  },
  {
    id: "process-models",
    title: "Process Models",
    icon: "⚙️",
    description: "Design, performance, and memory efficiency",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "pm-1",
        text: "Labeled swim-lanes with default assignment",
        detail: "Every swim lane should be labeled and have a default user/group assignment.",
      },
      {
        id: "pm-2",
        text: "Dynamic display name with key differentiator",
        detail: "Process display name should be dynamic and include a unique attribute (e.g. employee name, request ID).",
      },
      {
        id: "pm-3",
        text: "All process flows tested with no errors",
        detail: "Execute every possible path through the process model and verify no errors occur.",
      },
      {
        id: "pm-4",
        text: "Custom alert settings configured using groups",
        detail: "Configure alerts to notify the right groups when processes fail or need attention.",
      },
      {
        id: "pm-5",
        text: "Correct archival/deletion settings",
        detail: "User input processes: Archive after 3 days. Everything else: Delete after 0 days.",
      },
      {
        id: "pm-6",
        text: "Split into sub-processes (avoid monolithic models)",
        detail: "Compartmentalize functionality into sub-processes. Avoid large, cumbersome models.",
      },
      {
        id: "pm-7",
        text: "Correct use of Start Process vs Sub-Process",
        detail: "Use Start Process by default. Use Sub-Process only for: activity chaining, synchronous execution, or returning variables to parent.",
      },
      {
        id: "pm-8",
        text: "No more than 30 nodes per model",
        detail: "Keep process models under 30 nodes. Split into sub-processes if needed.",
      },
      {
        id: "pm-9",
        text: "No more than 50 process variables",
        detail: "Limit process variables to 50. Consider using CDTs to group related variables.",
      },
      {
        id: "pm-10",
        text: "XOR gateways before MNI nodes to check for empty/null",
        detail: "Always guard Multiple Node Instance nodes with an XOR gateway checking for empty/null values.",
      },
      {
        id: "pm-11",
        text: "All flows reach a terminating end event",
        detail: "Verify every possible path through the model reaches at least one end event.",
      },
      {
        id: "pm-12",
        text: "Process messages targeted to specific PID",
        detail: "Process-to-process messages must target a specific process instance using PID.",
      },
      {
        id: "pm-13",
        text: "Complex logic documented with annotations",
        detail: "Add annotation nodes to explain anything that isn't immediately obvious.",
      },
      {
        id: "pm-14",
        text: "External integrations contained in their own subprocesses",
        detail: "Encapsulate all external integrations (except query rules/data stores) in dedicated subprocesses to isolate changes.",
      },
      {
        id: "pm-15",
        text: "Activity chaining only used when needed for UX",
        detail: "Only use Activity Chaining to support a cohesive user experience, not as a general pattern.",
      },
      {
        id: "pm-16",
        text: "Integration CDTs separated from business CDTs",
        detail: "If integrations use CDTs for data exchange, create separate business CDTs for application use. This prevents external changes from cascading.",
      },
      {
        id: "pm-17",
        text: "Memory-efficient model best practices followed",
        detail: "Follow Appian best practices for creating memory efficient models.",
      },
      {
        id: "pm-18",
        text: "Short-lived processes for actions and data maintenance",
        detail: "Design processes to perform their actions and complete quickly rather than running indefinitely.",
      },
      {
        id: "pm-19",
        text: "No unintentional loops through smart service nodes",
        detail: "Verify there's no way to accidentally loop through a DB write, document creation, or similar smart service.",
      },
    ],
  },
  {
    id: "process-nodes",
    title: "Process Nodes",
    icon: "🔗",
    description: "Node naming, forms, and gateways",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "pn-1",
        text: "Nodes named with verb-noun format",
        detail: "Examples: 'Review Purchase Order', 'Create Employee Record', 'Send Notification'.",
      },
      {
        id: "pn-2",
        text: "Task display name is set and dynamic",
        detail: "Task names should be dynamic and descriptive, including relevant context.",
      },
      {
        id: "pn-3",
        text: "SAIL form nodes have all inputs specified",
        detail: "Every SAIL form node must have all inputs specified as process variables or activity class parameters.",
      },
      {
        id: "pn-4",
        text: "XOR/OR gateways have a single incoming flow",
        detail: "Gateways should have exactly one incoming flow. Use intermediate events or merge nodes if needed.",
      },
      {
        id: "pn-5",
        text: "All outgoing gateway flows are labeled",
        detail: "Every outgoing flow from a gateway must be labeled to describe the condition.",
      },
      {
        id: "pn-6",
        text: "XOR gateways used instead of OR",
        detail: "Prefer XOR (exclusive) gateways over OR gateways for clearer process logic.",
      },
      {
        id: "pn-7",
        text: "Node inputs do not duplicate query calls",
        detail: "Don't make the same query call more than once in a node's inputs.",
      },
      {
        id: "pn-8",
        text: "CDTs not passed by reference between parent and sub-process",
        detail: "Pass CDTs by value to avoid unexpected side effects between parent and sub-process.",
        docUrl: "https://docs.appian.com/suite/help/latest/Sub-Process_Activity.html#passing-a-process-variable-as-a-reference",
      },
      {
        id: "pn-9",
        text: "Looping functions used instead of MNI where possible",
        detail: "Use Appian looping functions (forEach, reduce, etc.) instead of Multiple Node Instances when possible.",
        docUrl: "https://docs.appian.com/suite/help/latest/Appian_Functions.html",
      },
      {
        id: "pn-10",
        text: "Forms: 'Delete previous instances' checked, 'Keep record' unchecked",
        detail: "On the Other Tab for Forms, check 'Delete previous instances' and do not check 'Keep a record of the form'.",
      },
      {
        id: "pn-11",
        text: "Rules and constants used instead of hard-coded values",
        detail: "No hard-coded values in process nodes. Use expression rules and constants.",
      },
    ],
  },
  {
    id: "groups",
    title: "Groups",
    icon: "👥",
    description: "Group types, visibility, and management",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "grp-1",
        text: "All groups created as Custom groups",
        detail: "Always create Custom groups rather than other group types.",
      },
      {
        id: "grp-2",
        text: "Visibility setting configured for UI-selectable groups",
        detail: "If a group should be selectable in a user interface, ensure the Visibility setting is properly configured.",
      },
      {
        id: "grp-3",
        text: "Never delete groups in production",
        detail: "Group identifiers are reused when deleted, which can affect security and behavior. Deactivate instead of deleting.",
      },
    ],
  },
  {
    id: "data-types",
    title: "Data Types (CDTs)",
    icon: "🗃️",
    description: "Namespace, naming, and structure",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "dt-1",
        text: "CDTs use application-specific namespace",
        detail: "Example: urn:com:appian:types:ABC. Use a unique namespace per application.",
      },
      {
        id: "dt-2",
        text: "CDT name matches underlying database table/view name",
        detail: "Name CDTs to closely match their database table or view name with proper formatting.",
      },
      {
        id: "dt-3",
        text: "All Data Store CDTs expose a primary key field",
        detail: "Every CDT stored in a Data Store must have a primary key field defined.",
      },
      {
        id: "dt-4",
        text: "CDTs contain no more than 50 fields",
        detail: "Keep CDTs under 50 fields. This does not apply to CDTs created by web services.",
      },
      {
        id: "dt-5",
        text: "No more than 1 level of nested CDTs",
        detail: "Limit nesting to one level. This does not apply to CDTs created by web services.",
      },
      {
        id: "dt-6",
        text: "No nested lists that aren't separate CDTs",
        detail: "Nested lists (e.g. a list of Text within a CDT) should be defined as separate CDTs.",
      },
    ],
  },
  {
    id: "documents",
    title: "Document Folders",
    icon: "📁",
    description: "Content organization and security",
    frequency: "Every feature / peer review",
    items: [
      {
        id: "doc-1",
        text: "Application contents in app-specific KC and folder structure",
        detail: "Store all application content within application-specific Knowledge Centers, not in the Default Community.",
      },
      {
        id: "doc-2",
        text: "Reports stored in application folder (not System Reports)",
        detail: "Keep reports organized within the application's folder structure.",
      },
      {
        id: "doc-3",
        text: "Process-created folders have specific security defined",
        detail: "When processes create folders, ensure appropriate security is applied.",
      },
    ],
  },
  {
    id: "ux",
    title: "User Experience",
    icon: "🎨",
    description: "Consistency, usability, and performance",
    frequency: "Before sprint completion (application-wide review)",
    items: [
      {
        id: "ux-1",
        text: "Consistent UI throughout the application",
        detail: "Check for consistency in: interface layouts, position of key widgets, and overall look and feel.",
      },
      {
        id: "ux-2",
        text: "All actions, records, reports have useful names and descriptions",
        detail: "User-facing objects should have clear, descriptive names and helpful descriptions.",
      },
      {
        id: "ux-3",
        text: "Clicks, key presses, and scrolling minimized",
        detail: "Optimize the user journey to minimize unnecessary interactions.",
      },
      {
        id: "ux-4",
        text: "No performance findings in Appian Health Check",
        detail: "Address all performance-related findings from the Health Check.",
      },
      {
        id: "ux-5",
        text: "All acceptance criteria met or updated",
        detail: "Verify all acceptance criteria are satisfied. Update or remove any that are no longer relevant.",
      },
      {
        id: "ux-6",
        text: "Functionality can be run successfully",
        detail: "End-to-end testing confirms all features work as expected.",
      },
    ],
  },
];
