/**
 * Client-side Appian XML pre-processor.
 * Extracts structured inventory from raw export XML,
 * stripping boilerplate so Claude can focus on analysis.
 */

export interface AppianObject {
  uuid?: string;
  name: string;
  type: string;
  description?: string;
  details: Record<string, unknown>;
  references: string[]; // UUIDs or names this object references
}

export interface AppianInventory {
  projectName: string;
  objectCount: number;
  summary: {
    processModels: number;
    expressionRules: number;
    interfaces: number;
    cdts: number;
    recordTypes: number;
    constants: number;
    groups: number;
    connectedSystems: number;
    integrations: number;
    webApis: number;
    decisions: number;
    sites: number;
    other: number;
  };
  objects: AppianObject[];
  crossReferences: { from: string; to: string; type: string }[];
}

// UUID pattern used throughout Appian exports
const UUID_PATTERN = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;

// Appian object type identifiers found in export XML
const OBJECT_TYPE_MAP: Record<string, string> = {
  "processModel": "Process Model",
  "weightedScoringModel": "Decision",
  "content": "Expression Rule",
  "rule": "Expression Rule",
  "interfaceDesign": "Interface",
  "sailInterface": "Interface",
  "datatype": "CDT",
  "recordType": "Record Type",
  "constant": "Constant",
  "group": "Group",
  "connectedSystem": "Connected System",
  "integration": "Integration",
  "webApi": "Web API",
  "site": "Site",
  "portal": "Portal",
  "document": "Document",
  "folder": "Folder",
  "communityObject": "Community",
  "tempo_report": "Report",
  "feed": "Feed",
};

function getTextContent(el: Element, tagName: string): string {
  const child = el.getElementsByTagName(tagName)[0];
  return child?.textContent?.trim() || "";
}

function getAllTextContent(el: Element, tagName: string): string[] {
  const children = el.getElementsByTagName(tagName);
  const results: string[] = [];
  for (let i = 0; i < children.length; i++) {
    const text = children[i].textContent?.trim();
    if (text) results.push(text);
  }
  return results;
}

function extractUuidRefs(text: string): string[] {
  const matches = text.match(UUID_PATTERN);
  return matches ? [...new Set(matches)] : [];
}

function parseProcessModel(el: Element, rawXml: string): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  // Extract process nodes/activities
  const nodes: { name: string; type: string }[] = [];
  const nodeEls = el.getElementsByTagName("node") || el.getElementsByTagName("activity");
  for (let i = 0; i < nodeEls.length; i++) {
    const node = nodeEls[i];
    nodes.push({
      name: getTextContent(node, "name") || getTextContent(node, "label") || `Node ${i}`,
      type: node.getAttribute("type") || node.tagName || "unknown",
    });
  }
  if (nodes.length) details.nodes = nodes;

  // Extract process variables / parameters
  const pvs: { name: string; type: string }[] = [];
  const pvEls = el.getElementsByTagName("processVariable") || [];
  for (let i = 0; i < pvEls.length; i++) {
    pvs.push({
      name: getTextContent(pvEls[i], "name") || `pv${i}`,
      type: getTextContent(pvEls[i], "type") || "Any",
    });
  }
  // Also check for process parameters
  const paramEls = el.getElementsByTagName("param");
  for (let i = 0; i < paramEls.length; i++) {
    const name = getTextContent(paramEls[i], "name") || paramEls[i].getAttribute("name");
    if (name) pvs.push({ name, type: getTextContent(paramEls[i], "type") || "Any" });
  }
  if (pvs.length) details.variables = pvs;

  // Extract swim lanes
  const lanes = getAllTextContent(el, "laneName");
  if (lanes.length) details.swimLanes = lanes;

  // Extract gateway info
  const gateways = el.getElementsByTagName("gateway");
  if (gateways.length) {
    details.gatewayCount = gateways.length;
  }

  // Count exception flows
  const exceptions = el.getElementsByTagName("exceptionFlow");
  if (exceptions.length) {
    details.exceptionFlows = exceptions.length;
  }

  return { details };
}

function parseExpressionRule(el: Element, rawXml: string): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  // Extract rule definition / body
  const definition = getTextContent(el, "definition") ||
    getTextContent(el, "expression") ||
    getTextContent(el, "ruleExpression");
  if (definition) {
    // Keep the expression but truncate if enormous
    details.expression = definition.length > 2000
      ? definition.slice(0, 2000) + "... [truncated]"
      : definition;
  }

  // Extract inputs
  const inputs: { name: string; type: string }[] = [];
  const inputEls = el.getElementsByTagName("ruleInput") || el.getElementsByTagName("input");
  for (let i = 0; i < inputEls.length; i++) {
    inputs.push({
      name: getTextContent(inputEls[i], "name") || inputEls[i].getAttribute("name") || `ri${i}`,
      type: getTextContent(inputEls[i], "type") || "Any",
    });
  }
  if (inputs.length) details.inputs = inputs;

  // Detect key functions used
  if (definition) {
    const funcMatches = definition.match(/a![a-zA-Z_]+\(/g);
    if (funcMatches) {
      details.appianFunctions = [...new Set(funcMatches.map(f => f.slice(0, -1)))].slice(0, 20);
    }
  }

  return { details };
}

function parseCDT(el: Element): Partial<AppianObject> {
  const details: Record<string, unknown> = {};
  const fields: { name: string; type: string; required?: boolean }[] = [];

  const fieldEls = el.getElementsByTagName("field");
  for (let i = 0; i < fieldEls.length; i++) {
    const field = fieldEls[i];
    fields.push({
      name: getTextContent(field, "name") || field.getAttribute("name") || `field${i}`,
      type: getTextContent(field, "type") || field.getAttribute("type") || "Text",
      required: field.getAttribute("required") === "true",
    });
  }

  // Also check for typedValue / element structures
  const elementEls = el.getElementsByTagName("element");
  for (let i = 0; i < elementEls.length; i++) {
    const elem = elementEls[i];
    const name = elem.getAttribute("name") || getTextContent(elem, "name");
    if (name && !fields.find(f => f.name === name)) {
      fields.push({
        name,
        type: elem.getAttribute("type") || getTextContent(elem, "type") || "Text",
      });
    }
  }

  if (fields.length) details.fields = fields;

  // Check for database table mapping
  const tableName = getTextContent(el, "tableName") || getTextContent(el, "dataStoreEntity");
  if (tableName) details.tableName = tableName;

  return { details };
}

function parseRecordType(el: Element): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  // Source info
  const source = getTextContent(el, "source") || getTextContent(el, "dataSource");
  if (source) details.source = source;

  // Fields
  const fields: { name: string; type: string }[] = [];
  const fieldEls = el.getElementsByTagName("recordField") || el.getElementsByTagName("field");
  for (let i = 0; i < fieldEls.length; i++) {
    fields.push({
      name: getTextContent(fieldEls[i], "name") || fieldEls[i].getAttribute("name") || `field${i}`,
      type: getTextContent(fieldEls[i], "type") || "Text",
    });
  }
  if (fields.length) details.fields = fields;

  // Relationships
  const relationships: { name: string; type: string; relatedRecord: string }[] = [];
  const relEls = el.getElementsByTagName("relationship");
  for (let i = 0; i < relEls.length; i++) {
    relationships.push({
      name: getTextContent(relEls[i], "name") || `rel${i}`,
      type: relEls[i].getAttribute("type") || getTextContent(relEls[i], "type") || "1:many",
      relatedRecord: getTextContent(relEls[i], "relatedRecordType") || "",
    });
  }
  if (relationships.length) details.relationships = relationships;

  // Record actions
  const actions = getAllTextContent(el, "recordAction");
  if (actions.length) details.recordActions = actions;

  // Record views
  const views = getAllTextContent(el, "recordView");
  if (views.length) details.recordViews = views;

  return { details };
}

function parseInterface(el: Element, rawXml: string): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  // Extract SAIL definition
  const definition = getTextContent(el, "definition") ||
    getTextContent(el, "expression") ||
    getTextContent(el, "interfaceExpression");
  
  if (definition) {
    // Extract component types used
    const compMatches = definition.match(/a![a-zA-Z_]+\(/g);
    if (compMatches) {
      const components = [...new Set(compMatches.map(c => c.slice(0, -1)))];
      details.sailComponents = components.slice(0, 30);

      // Categorise - forms vs reports vs dashboards
      const hasInputs = components.some(c =>
        c.includes("textField") || c.includes("dropdownField") ||
        c.includes("dateField") || c.includes("paragraphField") ||
        c.includes("radioButtonField") || c.includes("checkboxField") ||
        c.includes("pickerField") || c.includes("fileUploadField")
      );
      const hasGrids = components.some(c =>
        c.includes("gridLayout") || c.includes("gridField") ||
        c.includes("recordGrid")
      );
      const hasCharts = components.some(c =>
        c.includes("Chart") || c.includes("chart") ||
        c.includes("gauge") || c.includes("kpi")
      );

      if (hasCharts || (hasGrids && !hasInputs)) details.interfaceType = "Report/Dashboard";
      else if (hasInputs) details.interfaceType = "Form";
      else details.interfaceType = "Display";
    }

    // Extract rule inputs
    const inputs: string[] = [];
    const riMatches = definition.match(/ri![a-zA-Z_0-9]+/g);
    if (riMatches) {
      inputs.push(...new Set(riMatches));
    }
    if (inputs.length) details.ruleInputs = inputs.slice(0, 20);

    // Expression body (truncated)
    details.expression = definition.length > 1500
      ? definition.slice(0, 1500) + "... [truncated]"
      : definition;
  }

  return { details };
}

function parseConstant(el: Element): Partial<AppianObject> {
  const details: Record<string, unknown> = {};
  
  const value = getTextContent(el, "value") || getTextContent(el, "typedValue");
  if (value) {
    details.value = value.length > 200 ? value.slice(0, 200) + "..." : value;
  }
  
  const dataType = getTextContent(el, "type") || getTextContent(el, "dataType");
  if (dataType) details.dataType = dataType;

  return { details };
}

function parseConnectedSystem(el: Element): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  const url = getTextContent(el, "baseUrl") || getTextContent(el, "url") || getTextContent(el, "wsdlUrl");
  if (url) details.url = url;

  const authType = getTextContent(el, "authenticationType") || getTextContent(el, "authentication");
  if (authType) details.authentication = authType;

  const protocol = getTextContent(el, "type") || getTextContent(el, "protocol");
  if (protocol) details.protocol = protocol;

  return { details };
}

function parseIntegration(el: Element): Partial<AppianObject> {
  const details: Record<string, unknown> = {};

  const method = getTextContent(el, "httpMethod") || getTextContent(el, "method");
  if (method) details.httpMethod = method;

  const path = getTextContent(el, "path") || getTextContent(el, "relativePath");
  if (path) details.path = path;

  const connectedSystem = getTextContent(el, "connectedSystem");
  if (connectedSystem) details.connectedSystem = connectedSystem;

  return { details };
}

function detectObjectType(el: Element, fileName: string): string {
  // Check element tag name
  const tag = el.tagName.toLowerCase();
  for (const [key, type] of Object.entries(OBJECT_TYPE_MAP)) {
    if (tag.includes(key.toLowerCase())) return type;
  }

  // Check type attributes
  const typeAttr = el.getAttribute("type") || el.getAttribute("objectType") || "";
  for (const [key, type] of Object.entries(OBJECT_TYPE_MAP)) {
    if (typeAttr.toLowerCase().includes(key.toLowerCase())) return type;
  }

  // Check child element hints
  if (el.getElementsByTagName("processVariable").length > 0 ||
      el.getElementsByTagName("node").length > 0 ||
      el.getElementsByTagName("activity").length > 0) {
    return "Process Model";
  }
  if (el.getElementsByTagName("ruleInput").length > 0 ||
      el.getElementsByTagName("ruleExpression").length > 0) {
    return "Expression Rule";
  }
  if (el.getElementsByTagName("recordField").length > 0) {
    return "Record Type";
  }
  if (el.getElementsByTagName("field").length > 0 &&
      el.getElementsByTagName("element").length > 0) {
    return "CDT";
  }

  // Check filename hints
  const fn = fileName.toLowerCase();
  if (fn.includes("process") || fn.includes("pm_")) return "Process Model";
  if (fn.includes("interface") || fn.includes("if_")) return "Interface";
  if (fn.includes("rule") || fn.includes("er_")) return "Expression Rule";
  if (fn.includes("constant") || fn.includes("cons_")) return "Constant";
  if (fn.includes("record")) return "Record Type";
  if (fn.includes("cdt") || fn.includes("datatype")) return "CDT";
  if (fn.includes("group")) return "Group";
  if (fn.includes("site")) return "Site";
  if (fn.includes("integration") || fn.includes("int_")) return "Integration";

  return "Other";
}

/**
 * Parse a single XML file from an Appian export and extract objects.
 */
function parseXmlFile(xmlString: string, fileName: string): AppianObject[] {
  const objects: AppianObject[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, "text/xml");

    // Check for parse errors
    const parseError = doc.getElementsByTagName("parsererror");
    if (parseError.length > 0) {
      // Try to salvage what we can via regex
      return parseXmlFallback(xmlString, fileName);
    }

    const root = doc.documentElement;

    // Appian exports can have different structures.
    // Try to find individual object elements.
    const processObjects = (elements: HTMLCollectionOf<Element> | Element[]) => {
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const name = getTextContent(el, "name") ||
          el.getAttribute("name") ||
          getTextContent(el, "label") ||
          fileName.replace(/\.xml$/i, "");
        const uuid = el.getAttribute("uuid") ||
          getTextContent(el, "uuid") ||
          el.getAttribute("id") || undefined;
        const description = getTextContent(el, "description") || "";
        const type = detectObjectType(el, fileName);

        let typeDetails: Partial<AppianObject> = {};
        const elXml = el.outerHTML || "";

        switch (type) {
          case "Process Model":
            typeDetails = parseProcessModel(el, elXml);
            break;
          case "Expression Rule":
            typeDetails = parseExpressionRule(el, elXml);
            break;
          case "CDT":
            typeDetails = parseCDT(el);
            break;
          case "Record Type":
            typeDetails = parseRecordType(el);
            break;
          case "Interface":
            typeDetails = parseInterface(el, elXml);
            break;
          case "Constant":
            typeDetails = parseConstant(el);
            break;
          case "Connected System":
            typeDetails = parseConnectedSystem(el);
            break;
          case "Integration":
            typeDetails = parseIntegration(el);
            break;
        }

        // Extract cross-references (UUIDs referenced in this object)
        const refs = extractUuidRefs(elXml).filter(r => r !== uuid);

        objects.push({
          uuid,
          name,
          type,
          description: description.length > 300 ? description.slice(0, 300) + "..." : description,
          details: typeDetails.details || {},
          references: refs,
        });
      }
    };

    // Strategy 1: Look for known container elements
    const containers = [
      "content", "rule", "processModel", "interfaceDesign",
      "datatype", "recordType", "constant", "group",
      "connectedSystem", "integration", "webApi", "site",
      "portal", "weightedScoringModel", "document",
      "sailInterface", "object", "objectExport"
    ];

    let found = false;
    for (const tag of containers) {
      const els = root.getElementsByTagName(tag);
      if (els.length > 0) {
        processObjects(els);
        found = true;
      }
    }

    // Strategy 2: If root itself is the object (single-object export files)
    if (!found) {
      processObjects([root]);
    }
  } catch (err) {
    console.warn(`Failed to parse ${fileName}:`, err);
    return parseXmlFallback(xmlString, fileName);
  }

  return objects;
}

/**
 * Fallback: extract what we can via regex when XML parsing fails.
 */
function parseXmlFallback(xmlString: string, fileName: string): AppianObject[] {
  const objects: AppianObject[] = [];

  // Try to find name
  const nameMatch = xmlString.match(/<name[^>]*>([^<]+)<\/name>/i);
  const name = nameMatch ? nameMatch[1].trim() : fileName.replace(/\.xml$/i, "");

  // Try to find description
  const descMatch = xmlString.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
  const description = descMatch ? descMatch[1].trim().slice(0, 300) : "";

  // Try to find UUID
  const uuidMatch = xmlString.match(/uuid="([^"]+)"/i);

  // Detect type from content
  let type = "Other";
  const fn = fileName.toLowerCase();
  if (fn.includes("process") || xmlString.includes("<processModel")) type = "Process Model";
  else if (fn.includes("interface") || xmlString.includes("sailInterface") || xmlString.includes("interfaceDesign")) type = "Interface";
  else if (fn.includes("rule") || xmlString.includes("ruleExpression")) type = "Expression Rule";
  else if (fn.includes("constant")) type = "Constant";
  else if (fn.includes("record") || xmlString.includes("recordType")) type = "Record Type";
  else if (fn.includes("cdt") || fn.includes("datatype")) type = "CDT";
  else if (fn.includes("group")) type = "Group";
  else if (fn.includes("integration")) type = "Integration";
  else if (fn.includes("connected")) type = "Connected System";

  // Extract expression if present
  const details: Record<string, unknown> = {};
  const exprMatch = xmlString.match(/<(?:definition|expression|ruleExpression)>([\s\S]*?)<\/(?:definition|expression|ruleExpression)>/i);
  if (exprMatch) {
    const expr = exprMatch[1].trim();
    details.expression = expr.length > 1500 ? expr.slice(0, 1500) + "... [truncated]" : expr;
    
    // Extract Appian functions
    const funcMatches = expr.match(/a![a-zA-Z_]+\(/g);
    if (funcMatches) {
      details.appianFunctions = [...new Set(funcMatches.map(f => f.slice(0, -1)))].slice(0, 20);
    }
  }

  const refs = extractUuidRefs(xmlString);
  if (uuidMatch) {
    const selfUuid = uuidMatch[1];
    objects.push({
      uuid: selfUuid,
      name,
      type,
      description,
      details,
      references: refs.filter(r => r !== selfUuid),
    });
  } else {
    objects.push({ name, type, description, details, references: refs });
  }

  return objects;
}

/**
 * Main entry point: parse all XML content and produce a structured inventory.
 */
export function parseAppianExport(
  xmlFiles: { name: string; content: string }[],
  projectName?: string
): AppianInventory {
  const allObjects: AppianObject[] = [];

  for (const file of xmlFiles) {
    const objects = parseXmlFile(file.content, file.name);
    allObjects.push(...objects);
  }

  // Deduplicate by UUID
  const seen = new Set<string>();
  const deduped = allObjects.filter(obj => {
    if (!obj.uuid) return true;
    if (seen.has(obj.uuid)) return false;
    seen.add(obj.uuid);
    return true;
  });

  // Build cross-reference map
  const uuidToName = new Map<string, string>();
  for (const obj of deduped) {
    if (obj.uuid) uuidToName.set(obj.uuid, obj.name);
  }

  const crossReferences: { from: string; to: string; type: string }[] = [];
  for (const obj of deduped) {
    for (const ref of obj.references) {
      const targetName = uuidToName.get(ref);
      if (targetName) {
        crossReferences.push({
          from: obj.name,
          to: targetName,
          type: "references",
        });
      }
    }
  }

  // Count by type
  const count = (type: string) => deduped.filter(o => o.type === type).length;

  // Detect project name
  let detectedName = projectName || "";
  if (!detectedName) {
    // Try from package or application elements
    for (const file of xmlFiles) {
      const match = file.content.match(/<(?:package|application)[^>]*name="([^"]+)"/i) ||
                    file.content.match(/<applicationName[^>]*>([^<]+)</i);
      if (match) { detectedName = match[1]; break; }
    }
  }
  if (!detectedName) detectedName = "Appian Application";

  return {
    projectName: detectedName,
    objectCount: deduped.length,
    summary: {
      processModels: count("Process Model"),
      expressionRules: count("Expression Rule"),
      interfaces: count("Interface"),
      cdts: count("CDT"),
      recordTypes: count("Record Type"),
      constants: count("Constant"),
      groups: count("Group"),
      connectedSystems: count("Connected System"),
      integrations: count("Integration"),
      webApis: count("Web API"),
      decisions: count("Decision"),
      sites: count("Site"),
      other: count("Other") + count("Document") + count("Folder") + count("Portal"),
    },
    objects: deduped,
    crossReferences,
  };
}

/**
 * Convert inventory to a compact text representation for the LLM prompt.
 * This is what actually gets sent instead of raw XML.
 */
export function inventoryToPrompt(inventory: AppianInventory): string {
  const lines: string[] = [];

  lines.push(`# Appian Application: ${inventory.projectName}`);
  lines.push(`Total objects: ${inventory.objectCount}`);
  lines.push("");

  // Summary counts
  lines.push("## Object Counts");
  const s = inventory.summary;
  const counts = [
    ["Process Models", s.processModels],
    ["Expression Rules", s.expressionRules],
    ["Interfaces", s.interfaces],
    ["CDTs", s.cdts],
    ["Record Types", s.recordTypes],
    ["Constants", s.constants],
    ["Groups", s.groups],
    ["Connected Systems", s.connectedSystems],
    ["Integrations", s.integrations],
    ["Web APIs", s.webApis],
    ["Decisions", s.decisions],
    ["Sites", s.sites],
  ].filter(([, c]) => (c as number) > 0);

  for (const [label, c] of counts) {
    lines.push(`- ${label}: ${c}`);
  }
  lines.push("");

  // Group objects by type and output details
  const typeOrder = [
    "Site", "Record Type", "CDT", "Process Model",
    "Interface", "Expression Rule", "Integration",
    "Connected System", "Web API", "Constant",
    "Group", "Decision", "Other"
  ];

  for (const type of typeOrder) {
    const objs = inventory.objects.filter(o => o.type === type);
    if (objs.length === 0) continue;

    lines.push(`## ${type}s (${objs.length})`);
    lines.push("");

    for (const obj of objs) {
      lines.push(`### ${obj.name}`);
      if (obj.description) lines.push(`Description: ${obj.description}`);

      const d = obj.details;

      // Type-specific output
      if (type === "CDT" || type === "Record Type") {
        if (d.tableName) lines.push(`Database table: ${d.tableName}`);
        if (d.source) lines.push(`Source: ${d.source}`);
        if (d.fields && Array.isArray(d.fields)) {
          lines.push("Fields:");
          for (const f of d.fields as { name: string; type: string; required?: boolean }[]) {
            lines.push(`  - ${f.name}: ${f.type}${f.required ? " (required)" : ""}`);
          }
        }
        if (d.relationships && Array.isArray(d.relationships)) {
          lines.push("Relationships:");
          for (const r of d.relationships as { name: string; type: string; relatedRecord: string }[]) {
            lines.push(`  - ${r.name} (${r.type}) -> ${r.relatedRecord}`);
          }
        }
        if (d.recordActions) lines.push(`Record actions: ${(d.recordActions as string[]).join(", ")}`);
        if (d.recordViews) lines.push(`Record views: ${(d.recordViews as string[]).join(", ")}`);
      }

      if (type === "Process Model") {
        if (d.variables && Array.isArray(d.variables)) {
          lines.push(`Process variables: ${(d.variables as { name: string; type: string }[]).map(v => `${v.name}:${v.type}`).join(", ")}`);
        }
        if (d.nodes && Array.isArray(d.nodes)) {
          lines.push(`Nodes (${(d.nodes as unknown[]).length}): ${(d.nodes as { name: string; type: string }[]).map(n => `${n.name} [${n.type}]`).join(", ")}`);
        }
        if (d.swimLanes) lines.push(`Swim lanes: ${(d.swimLanes as string[]).join(", ")}`);
        if (d.gatewayCount) lines.push(`Gateways: ${d.gatewayCount}`);
        if (d.exceptionFlows) lines.push(`Exception flows: ${d.exceptionFlows}`);
      }

      if (type === "Expression Rule") {
        if (d.inputs && Array.isArray(d.inputs)) {
          lines.push(`Inputs: ${(d.inputs as { name: string; type: string }[]).map(i => `${i.name}:${i.type}`).join(", ")}`);
        }
        if (d.appianFunctions) lines.push(`Functions used: ${(d.appianFunctions as string[]).join(", ")}`);
        if (d.expression) lines.push(`Logic:\n${d.expression}`);
      }

      if (type === "Interface") {
        if (d.interfaceType) lines.push(`Type: ${d.interfaceType}`);
        if (d.sailComponents) lines.push(`Components: ${(d.sailComponents as string[]).join(", ")}`);
        if (d.ruleInputs) lines.push(`Rule inputs: ${(d.ruleInputs as string[]).join(", ")}`);
        if (d.expression) lines.push(`SAIL:\n${d.expression}`);
      }

      if (type === "Constant") {
        if (d.dataType) lines.push(`Type: ${d.dataType}`);
        if (d.value) lines.push(`Value: ${d.value}`);
      }

      if (type === "Connected System") {
        if (d.protocol) lines.push(`Protocol: ${d.protocol}`);
        if (d.url) lines.push(`URL: ${d.url}`);
        if (d.authentication) lines.push(`Auth: ${d.authentication}`);
      }

      if (type === "Integration") {
        if (d.httpMethod) lines.push(`Method: ${d.httpMethod}`);
        if (d.path) lines.push(`Path: ${d.path}`);
        if (d.connectedSystem) lines.push(`Connected system: ${d.connectedSystem}`);
      }

      lines.push("");
    }
  }

  // Cross-references
  if (inventory.crossReferences.length > 0) {
    lines.push("## Cross-References");
    // Group and limit to prevent prompt explosion
    const refGroups = new Map<string, string[]>();
    for (const ref of inventory.crossReferences) {
      const existing = refGroups.get(ref.from) || [];
      existing.push(ref.to);
      refGroups.set(ref.from, existing);
    }
    for (const [from, tos] of refGroups) {
      const uniqueTos = [...new Set(tos)];
      lines.push(`- ${from} -> ${uniqueTos.slice(0, 10).join(", ")}${uniqueTos.length > 10 ? ` (+${uniqueTos.length - 10} more)` : ""}`);
    }
  }

  return lines.join("\n");
}
