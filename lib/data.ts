export interface FunctionItem {
  name: string;
  syntax: string;
  description: string;
  example?: string;
  category: string;
  subcategory?: string;
  docUrl?: string;
}

// Sorted alphabetically
export const categories = [
  "Array",
  "Conversion",
  "Data & Query",
  "Date & Time",
  "Document",
  "Informational",
  "Interface Components",
  "Layout Components",
  "Logical",
  "Looping",
  "Mathematical",
  "People",
  "Process",
  "Records",
  "Scripting",
  "System",
  "Text",
];

export const functions: FunctionItem[] = [
  // ==================== ARRAY ====================
  {
    name: "append",
    syntax: "append(array, value)",
    description: "Adds a value to the end of an array.",
    example: 'append({1, 2}, 3) → {1, 2, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_append.html"
  },
  {
    name: "insert",
    syntax: "insert(array, value, index)",
    description: "Inserts a value at the specified index.",
    example: 'insert({1, 3}, 2, 2) → {1, 2, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_insert.html"
  },
  {
    name: "remove",
    syntax: "remove(array, index)",
    description: "Removes the item at the specified index.",
    example: 'remove({1, 2, 3}, 2) → {1, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_remove.html"
  },
  {
    name: "index",
    syntax: "index(array, index, [default])",
    description: "Returns the item at the specified index, with optional default.",
    example: 'index({"a", "b", "c"}, 2) → "b"',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_index.html"
  },
  {
    name: "contains",
    syntax: "contains(array, value)",
    description: "Returns true if the array contains the value.",
    example: 'contains({1, 2, 3}, 2) → true',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_contains.html"
  },
  {
    name: "wherecontains",
    syntax: "wherecontains(value, array)",
    description: "Returns indices where value appears in array.",
    example: 'wherecontains("b", {"a", "b", "c"}) → 2',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_wherecontains.html"
  },
  {
    name: "union",
    syntax: "union(array1, array2)",
    description: "Returns combined unique values from both arrays.",
    example: 'union({1, 2}, {2, 3}) → {1, 2, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_union.html"
  },
  {
    name: "intersection",
    syntax: "intersection(array1, array2)",
    description: "Returns values that exist in both arrays.",
    example: 'intersection({1, 2, 3}, {2, 3, 4}) → {2, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_intersection.html"
  },
  {
    name: "difference",
    syntax: "difference(array1, array2)",
    description: "Returns values in array1 that are not in array2.",
    example: 'difference({1, 2, 3}, {2}) → {1, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_difference.html"
  },
  {
    name: "distinct",
    syntax: "distinct(array)",
    description: "Returns unique values from the array.",
    example: 'distinct({1, 2, 2, 3}) → {1, 2, 3}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_set_distinct.html"
  },
  {
    name: "reverse",
    syntax: "reverse(array)",
    description: "Returns the array in reverse order.",
    example: 'reverse({1, 2, 3}) → {3, 2, 1}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_reverse.html"
  },
  {
    name: "ldrop",
    syntax: "ldrop(array, count)",
    description: "Removes count items from the left (start).",
    example: 'ldrop({1, 2, 3, 4}, 2) → {3, 4}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_ldrop.html"
  },
  {
    name: "rdrop",
    syntax: "rdrop(array, count)",
    description: "Removes count items from the right (end).",
    example: 'rdrop({1, 2, 3, 4}, 2) → {1, 2}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_rdrop.html"
  },
  {
    name: "joinarray",
    syntax: "joinarray(array, separator)",
    description: "Joins array elements into a string with separator.",
    example: 'joinarray({"a", "b", "c"}, ",") → "a,b,c"',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_joinarray.html"
  },
  {
    name: "merge",
    syntax: "merge(array1, array2, ...)",
    description: "Merges multiple arrays into an array of arrays.",
    example: 'merge({1,2}, {"a","b"}) → {{1,"a"}, {2,"b"}}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_merge.html"
  },
  {
    name: "length",
    syntax: "length(array)",
    description: "Returns the number of items in an array.",
    example: 'length({1, 2, 3}) → 3',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_length.html"
  },
  {
    name: "sublist",
    syntax: "sublist(array, startIndex, length)",
    description: "Returns a portion of an array.",
    example: 'sublist({1,2,3,4,5}, 2, 3) → {2,3,4}',
    category: "Array",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_array_sublist.html"
  },

  // ==================== CONVERSION ====================
  {
    name: "tostring",
    syntax: "tostring(value)",
    description: "Converts a value to text.",
    example: 'tostring(123) → "123"',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_tostring.html"
  },
  {
    name: "tointeger",
    syntax: "tointeger(value)",
    description: "Converts a value to an integer.",
    example: 'tointeger("123") → 123',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_tointeger.html"
  },
  {
    name: "todecimal",
    syntax: "todecimal(value)",
    description: "Converts a value to a decimal number.",
    example: 'todecimal("3.14") → 3.14',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_todecimal.html"
  },
  {
    name: "todate",
    syntax: "todate(value)",
    description: "Converts a value to a date.",
    example: 'todate("2026-02-05") → 2026-02-05',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_todate.html"
  },
  {
    name: "todatetime",
    syntax: "todatetime(value)",
    description: "Converts a value to a datetime.",
    example: 'todatetime("2026-02-05 14:30:00")',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_todatetime.html"
  },
  {
    name: "toboolean",
    syntax: "toboolean(value)",
    description: "Converts a value to a boolean.",
    example: 'toboolean("true") → true',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_toboolean.html"
  },
  {
    name: "totime",
    syntax: "totime(value)",
    description: "Converts a value to a time.",
    example: 'totime("14:30:00") → 14:30:00',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_totime.html"
  },
  {
    name: "displayvalue",
    syntax: "displayvalue(value, inArray, outArray, [default])",
    description: "Maps input value to output using parallel arrays.",
    example: 'displayvalue(2, {1,2,3}, {"a","b","c"}) → "b"',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_displayvalue.html"
  },
  {
    name: "touser",
    syntax: "touser(value)",
    description: "Converts a username string to a User data type.",
    example: 'touser("john.doe")',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_touser.html"
  },
  {
    name: "togroup",
    syntax: "togroup(value)",
    description: "Converts a group ID to a Group data type.",
    example: 'togroup(123)',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_togroup.html"
  },
  {
    name: "torecord",
    syntax: "torecord(recordType, value)",
    description: "Converts a value to a record reference.",
    example: 'torecord(recordType!Employee, 123)',
    category: "Conversion",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_conversion_torecord.html"
  },

  // ==================== DATA & QUERY ====================
  {
    name: "a!localVariables",
    syntax: "a!localVariables(local!var1: value, ...expression)",
    description: "Defines local variables for use in an expression.",
    example: 'a!localVariables(local!x: 10, local!y: 20, local!x + local!y) → 30',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_evaluation_a_localvariables.html"
  },
  {
    name: "a!queryRecordType",
    syntax: "a!queryRecordType(recordType, fields, filters, pagingInfo)",
    description: "Queries a record type with filtering, sorting, and paging.",
    example: "a!queryRecordType(recordType: recordType!Employee, pagingInfo: a!pagingInfo(1, 100))",
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_records_a_queryrecordtype.html"
  },
  {
    name: "a!queryEntity",
    syntax: "a!queryEntity(entity, query, fetchTotalCount)",
    description: "Queries a data store entity.",
    example: "a!queryEntity(entity: cons!DS_ENTITY, query: a!query(...))",
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    name: "a!pagingInfo",
    syntax: "a!pagingInfo(startIndex, batchSize, sort)",
    description: "Defines paging for queries.",
    example: 'a!pagingInfo(startIndex: 1, batchSize: 50, sort: a!sortInfo(field: "name", ascending: true))',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_paginginfo.html"
  },
  {
    name: "a!sortInfo",
    syntax: "a!sortInfo(field, ascending)",
    description: "Defines sort order for queries.",
    example: 'a!sortInfo(field: "createdDate", ascending: false)',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_sortinfo.html"
  },
  {
    name: "a!queryFilter",
    syntax: "a!queryFilter(field, operator, value)",
    description: "Defines a filter condition for queries.",
    example: 'a!queryFilter(field: "status", operator: "=", value: "Active")',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryfilter.html"
  },
  {
    name: "a!queryLogicalExpression",
    syntax: "a!queryLogicalExpression(operator, filters, ignoreFiltersWithEmptyValues)",
    description: "Combines multiple filters with AND/OR logic.",
    example: 'a!queryLogicalExpression(operator: "AND", filters: {...})',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_querylogicalexpression.html"
  },
  {
    name: "a!aggregationFields",
    syntax: "a!aggregationFields(groupings, measures)",
    description: "Defines groupings and measures for aggregation queries.",
    example: 'a!aggregationFields(groupings: a!grouping(field: "department"), measures: a!measure(field: "salary", function: "SUM"))',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_aggregationfields.html"
  },
  {
    name: "a!grouping",
    syntax: "a!grouping(field, alias, interval)",
    description: "Defines a grouping field for aggregation.",
    example: 'a!grouping(field: "department", alias: "dept")',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_grouping.html"
  },
  {
    name: "a!measure",
    syntax: "a!measure(field, function, alias)",
    description: "Defines a measure (SUM, COUNT, AVG, etc.) for aggregation.",
    example: 'a!measure(field: "amount", function: "SUM", alias: "total")',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_measure.html"
  },
  {
    name: "todatasubset",
    syntax: "todatasubset(data, pagingInfo)",
    description: "Converts data to a DataSubset with paging.",
    example: 'todatasubset(local!data, a!pagingInfo(1, 50))',
    category: "Data & Query",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_todatasubset.html"
  },

  // ==================== DATE & TIME ====================
  {
    name: "today",
    syntax: "today()",
    description: "Returns the current date (without time).",
    example: "today() → 2026-02-05",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_today.html"
  },
  {
    name: "now",
    syntax: "now()",
    description: "Returns the current date and time.",
    example: "now() → 2026-02-05 08:45:00",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_now.html"
  },
  {
    name: "date",
    syntax: "date(year, month, day)",
    description: "Creates a date from year, month, and day values.",
    example: "date(2026, 2, 5) → 2026-02-05",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_date.html"
  },
  {
    name: "datetime",
    syntax: "datetime(year, month, day, hour, minute, second, [ms])",
    description: "Creates a datetime from individual components.",
    example: "datetime(2026, 2, 5, 14, 30, 0) → 2026-02-05 14:30:00",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_datetime.html"
  },
  {
    name: "time",
    syntax: "time(hour, minute, second)",
    description: "Creates a time value from components.",
    example: "time(14, 30, 0) → 14:30:00",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_time.html"
  },
  {
    name: "year",
    syntax: "year(date)",
    description: "Returns the year from a date.",
    example: "year(today()) → 2026",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_year.html"
  },
  {
    name: "month",
    syntax: "month(date)",
    description: "Returns the month (1-12) from a date.",
    example: "month(today()) → 2",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_month.html"
  },
  {
    name: "day",
    syntax: "day(date)",
    description: "Returns the day of month from a date.",
    example: "day(today()) → 5",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_day.html"
  },
  {
    name: "hour",
    syntax: "hour(datetime)",
    description: "Returns the hour (0-23) from a datetime.",
    example: "hour(now()) → 8",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_hour.html"
  },
  {
    name: "minute",
    syntax: "minute(datetime)",
    description: "Returns the minute (0-59) from a datetime.",
    example: "minute(now()) → 45",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_minute.html"
  },
  {
    name: "second",
    syntax: "second(datetime)",
    description: "Returns the second (0-59) from a datetime.",
    example: "second(now()) → 30",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_second.html"
  },
  {
    name: "weekday",
    syntax: "weekday(date)",
    description: "Returns the day of week (1=Sunday, 7=Saturday).",
    example: "weekday(today()) → 4 (Wednesday)",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_weekday.html"
  },
  {
    name: "weeknum",
    syntax: "weeknum(date)",
    description: "Returns the week number of the year.",
    example: "weeknum(today()) → 6",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_weeknum.html"
  },
  {
    name: "networkdays",
    syntax: "networkdays(startDate, endDate)",
    description: "Returns the number of working days between two dates.",
    example: "networkdays(date(2026,2,1), date(2026,2,10)) → 7",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_networkdays.html"
  },
  {
    name: "calworkdays",
    syntax: "calworkdays(startDate, endDate, calendarName)",
    description: "Returns working days using a system calendar.",
    example: 'calworkdays(today(), edate(today(), 1), "companyCalendar")',
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_calworkdays.html"
  },
  {
    name: "edate",
    syntax: "edate(date, months)",
    description: "Adds or subtracts months from a date.",
    example: "edate(today(), 3) → 2026-05-05",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_edate.html"
  },
  {
    name: "eomonth",
    syntax: "eomonth(date, months)",
    description: "Returns the last day of the month, offset by months.",
    example: "eomonth(today(), 0) → 2026-02-28",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_eomonth.html"
  },
  {
    name: "intervalds",
    syntax: "intervalds(days, hours, minutes, seconds)",
    description: "Creates a day-to-second interval for date arithmetic.",
    example: "now() + intervalds(0, 1, 30, 0) → adds 1h 30m",
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_intervalds.html"
  },
  {
    name: "gmt",
    syntax: "gmt(datetime, [timezone])",
    description: "Converts a datetime to GMT timezone.",
    example: 'gmt(now(), "America/New_York")',
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_gmt.html"
  },
  {
    name: "local",
    syntax: "local(datetime, timezone)",
    description: "Converts a GMT datetime to local timezone.",
    example: 'local(now(), "America/New_York")',
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_local.html"
  },
  {
    name: "datetext",
    syntax: "datetext(date, format)",
    description: "Formats a date as text using a pattern.",
    example: 'datetext(today(), "yyyy-MM-dd") → "2026-02-05"',
    category: "Date & Time",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_date_and_time_datetext.html"
  },

  // ==================== DOCUMENT ====================
  {
    name: "document",
    syntax: "document(docId, property)",
    description: "Returns document properties by ID.",
    example: 'document(123, "name") → "Report.pdf"',
    category: "Document",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_document.html"
  },
  {
    name: "folder",
    syntax: "folder(folderId, property)",
    description: "Returns folder properties by ID.",
    example: 'folder(456, "name") → "Reports"',
    category: "Document",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_folder.html"
  },
  {
    name: "a!iconNewsEvent",
    syntax: "a!iconNewsEvent(icon, timestamp, ...)",
    description: "Creates a news event with an icon.",
    example: 'a!iconNewsEvent(icon: "paper-plane", timestamp: now())',
    category: "Document",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_iconnewsevent.html"
  },
  {
    name: "a!documentImage",
    syntax: "a!documentImage(document)",
    description: "Creates an image from a document.",
    example: 'a!documentImage(document: cons!LOGO_DOC)',
    category: "Document",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_documentimage.html"
  },
  {
    name: "a!documentDownloadLink",
    syntax: "a!documentDownloadLink(label, document)",
    description: "Creates a download link for a document.",
    example: 'a!documentDownloadLink(label: "Download", document: local!doc)',
    category: "Document",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_documentdownloadlink.html"
  },

  // ==================== INFORMATIONAL ====================
  {
    name: "isnull",
    syntax: "isnull(value)",
    description: "Returns true if value is null.",
    example: "isnull(null) → true",
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_informational_isnull.html"
  },
  {
    name: "a!isNullOrEmpty",
    syntax: "a!isNullOrEmpty(value)",
    description: "Returns true if value is null, empty string, or empty list.",
    example: 'a!isNullOrEmpty("") → true',
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_isnullorempty.html"
  },
  {
    name: "a!isNotNullOrEmpty",
    syntax: "a!isNotNullOrEmpty(value)",
    description: "Returns true if value is NOT null, empty string, or empty list.",
    example: 'a!isNotNullOrEmpty("test") → true',
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_isnotnullorempty.html"
  },
  {
    name: "typeof",
    syntax: "typeof(value)",
    description: "Returns the data type of a value.",
    example: 'typeof("hello") → Text',
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_informational_typeof.html"
  },
  {
    name: "which",
    syntax: "which(booleanArray)",
    description: "Returns indices where the array values are true.",
    example: "which({false, true, true}) → {2, 3}",
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_informational_which.html"
  },
  {
    name: "property",
    syntax: "property(value, propertyName, [default])",
    description: "Gets a property from a CDT or map.",
    example: 'property(local!user, "firstName", "Unknown")',
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_informational_property.html"
  },
  {
    name: "a!defaultValue",
    syntax: "a!defaultValue(value, default)",
    description: "Returns default if value is null/empty.",
    example: 'a!defaultValue(null, "N/A") → "N/A"',
    category: "Informational",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_defaultvalue.html"
  },

  // ==================== INTERFACE COMPONENTS ====================
  {
    name: "a!textField",
    syntax: "a!textField(label, value, saveInto, ...)",
    description: "Single-line text input field.",
    example: 'a!textField(label: "Name", value: local!name, saveInto: local!name)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Text_Component.html"
  },
  {
    name: "a!paragraphField",
    syntax: "a!paragraphField(label, value, saveInto, ...)",
    description: "Multi-line text input field.",
    example: 'a!paragraphField(label: "Description", value: local!desc, saveInto: local!desc)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Paragraph_Component.html"
  },
  {
    name: "a!integerField",
    syntax: "a!integerField(label, value, saveInto, ...)",
    description: "Integer number input field.",
    example: 'a!integerField(label: "Quantity", value: local!qty, saveInto: local!qty)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Integer_Component.html"
  },
  {
    name: "a!decimalField",
    syntax: "a!decimalField(label, value, saveInto, ...)",
    description: "Decimal number input field.",
    example: 'a!decimalField(label: "Price", value: local!price, saveInto: local!price)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Decimal_Component.html"
  },
  {
    name: "a!dateField",
    syntax: "a!dateField(label, value, saveInto, ...)",
    description: "Date picker input field.",
    example: 'a!dateField(label: "Start Date", value: local!startDate, saveInto: local!startDate)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Date_Component.html"
  },
  {
    name: "a!dateTimeField",
    syntax: "a!dateTimeField(label, value, saveInto, ...)",
    description: "Date and time picker input field.",
    example: 'a!dateTimeField(label: "Meeting Time", value: local!meetingTime, saveInto: local!meetingTime)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/DateTime_Component.html"
  },
  {
    name: "a!dropdownField",
    syntax: "a!dropdownField(label, choiceLabels, choiceValues, value, saveInto, ...)",
    description: "Dropdown selection field.",
    example: 'a!dropdownField(label: "Status", choiceLabels: {"Active", "Inactive"}, choiceValues: {1, 2}, value: local!status, saveInto: local!status)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/Dropdown_Component.html"
  },
  {
    name: "a!radioButtonField",
    syntax: "a!radioButtonField(label, choiceLabels, choiceValues, value, saveInto, ...)",
    description: "Radio button selection.",
    example: 'a!radioButtonField(label: "Priority", choiceLabels: {"High", "Low"}, choiceValues: {1, 2}, value: local!priority, saveInto: local!priority)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/Radio_Button_Component.html"
  },
  {
    name: "a!checkboxField",
    syntax: "a!checkboxField(label, choiceLabels, choiceValues, value, saveInto, ...)",
    description: "Checkbox selection (multiple values).",
    example: 'a!checkboxField(label: "Options", choiceLabels: {"A", "B"}, choiceValues: {1, 2}, value: local!selected, saveInto: local!selected)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/Checkbox_Component.html"
  },
  {
    name: "a!pickerFieldUsers",
    syntax: "a!pickerFieldUsers(label, value, saveInto, ...)",
    description: "User picker for selecting users.",
    example: 'a!pickerFieldUsers(label: "Assignee", value: local!assignee, saveInto: local!assignee)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/User_Picker_Component.html"
  },
  {
    name: "a!pickerFieldGroups",
    syntax: "a!pickerFieldGroups(label, value, saveInto, ...)",
    description: "Group picker for selecting groups.",
    example: 'a!pickerFieldGroups(label: "Team", value: local!team, saveInto: local!team)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/Group_Picker_Component.html"
  },
  {
    name: "a!pickerFieldRecords",
    syntax: "a!pickerFieldRecords(label, recordType, value, saveInto, ...)",
    description: "Record picker for selecting records.",
    example: 'a!pickerFieldRecords(label: "Customer", recordType: recordType!Customer, value: local!customer, saveInto: local!customer)',
    category: "Interface Components",
    subcategory: "Selection",
    docUrl: "https://docs.appian.com/suite/help/25.4/Record_Picker_Component.html"
  },
  {
    name: "a!buttonWidget",
    syntax: "a!buttonWidget(label, value, saveInto, style, ...)",
    description: "Button that saves a value when clicked.",
    example: 'a!buttonWidget(label: "Submit", value: true, saveInto: local!submitted, style: "PRIMARY")',
    category: "Interface Components",
    subcategory: "Action",
    docUrl: "https://docs.appian.com/suite/help/25.4/Button_Component.html"
  },
  {
    name: "a!linkField",
    syntax: "a!linkField(links, ...)",
    description: "Displays one or more links.",
    example: 'a!linkField(links: a!safeLink(label: "Google", uri: "https://google.com"))',
    category: "Interface Components",
    subcategory: "Action",
    docUrl: "https://docs.appian.com/suite/help/25.4/Link_Component.html"
  },
  {
    name: "a!richTextDisplayField",
    syntax: "a!richTextDisplayField(value, ...)",
    description: "Displays rich text with formatting.",
    example: 'a!richTextDisplayField(value: a!richTextItem(text: "Bold", style: "STRONG"))',
    category: "Interface Components",
    subcategory: "Display",
    docUrl: "https://docs.appian.com/suite/help/25.4/Rich_Text_Component.html"
  },
  {
    name: "a!imageField",
    syntax: "a!imageField(images, ...)",
    description: "Displays one or more images.",
    example: 'a!imageField(images: a!documentImage(document: cons!LOGO))',
    category: "Interface Components",
    subcategory: "Display",
    docUrl: "https://docs.appian.com/suite/help/25.4/Image_Component.html"
  },
  {
    name: "a!gridField",
    syntax: "a!gridField(data, columns, ...)",
    description: "Read-only data grid for displaying records.",
    example: 'a!gridField(data: local!data, columns: {a!gridColumn(label: "Name", value: fv!row.name)})',
    category: "Interface Components",
    subcategory: "Data",
    docUrl: "https://docs.appian.com/suite/help/25.4/Paging_Grid_Component.html"
  },
  {
    name: "a!gridColumn",
    syntax: "a!gridColumn(label, value, ...)",
    description: "Defines a column in a!gridField.",
    example: 'a!gridColumn(label: "Name", value: fv!row.name, sortField: "name")',
    category: "Interface Components",
    subcategory: "Data",
    docUrl: "https://docs.appian.com/suite/help/25.4/Grid_Column_Component.html"
  },
  {
    name: "a!fileUploadField",
    syntax: "a!fileUploadField(label, value, saveInto, ...)",
    description: "File upload component.",
    example: 'a!fileUploadField(label: "Upload Document", value: local!files, saveInto: local!files)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/File_Upload_Component.html"
  },
  {
    name: "a!signatureField",
    syntax: "a!signatureField(label, value, saveInto, ...)",
    description: "Signature capture component.",
    example: 'a!signatureField(label: "Signature", value: local!signature, saveInto: local!signature)',
    category: "Interface Components",
    subcategory: "Input",
    docUrl: "https://docs.appian.com/suite/help/25.4/Signature_Component.html"
  },

  // ==================== LAYOUT COMPONENTS ====================
  {
    name: "a!columnsLayout",
    syntax: "a!columnsLayout(columns, ...)",
    description: "Creates a multi-column layout.",
    example: 'a!columnsLayout(columns: {a!columnLayout(contents: {...}), a!columnLayout(contents: {...})})',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Columns_Layout.html"
  },
  {
    name: "a!columnLayout",
    syntax: "a!columnLayout(contents, width, ...)",
    description: "Defines a column within a!columnsLayout.",
    example: 'a!columnLayout(contents: a!textField(...), width: "MEDIUM")',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Column_Layout.html"
  },
  {
    name: "a!sectionLayout",
    syntax: "a!sectionLayout(label, contents, ...)",
    description: "Groups components under a collapsible section header.",
    example: 'a!sectionLayout(label: "Details", contents: {...}, isCollapsible: true)',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Section_Layout.html"
  },
  {
    name: "a!cardLayout",
    syntax: "a!cardLayout(contents, ...)",
    description: "Displays content in a card with optional styling.",
    example: 'a!cardLayout(contents: {...}, style: "ACCENT")',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Card_Layout.html"
  },
  {
    name: "a!sideBySideLayout",
    syntax: "a!sideBySideLayout(items, ...)",
    description: "Arranges items horizontally.",
    example: 'a!sideBySideLayout(items: {a!sideBySideItem(item: ...), a!sideBySideItem(item: ...)})',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Side_By_Side_Layout.html"
  },
  {
    name: "a!formLayout",
    syntax: "a!formLayout(label, contents, buttons, ...)",
    description: "Top-level layout for forms with buttons.",
    example: 'a!formLayout(label: "My Form", contents: {...}, buttons: a!buttonLayout(...))',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Form_Layout.html"
  },
  {
    name: "a!boxLayout",
    syntax: "a!boxLayout(label, contents, ...)",
    description: "Displays content in a box with a header.",
    example: 'a!boxLayout(label: "Summary", contents: {...}, style: "INFO")',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Box_Layout.html"
  },
  {
    name: "a!stampField",
    syntax: "a!stampField(icon, text, backgroundColor, ...)",
    description: "Displays a stamp/badge with icon and text.",
    example: 'a!stampField(icon: "check", text: "Approved", backgroundColor: "POSITIVE")',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Stamp_Component.html"
  },
  {
    name: "a!billboardLayout",
    syntax: "a!billboardLayout(backgroundMedia, contents, ...)",
    description: "Full-width banner with background image.",
    example: 'a!billboardLayout(backgroundMedia: a!documentImage(document: cons!BANNER), contents: {...})',
    category: "Layout Components",
    docUrl: "https://docs.appian.com/suite/help/25.4/Billboard_Layout.html"
  },

  // ==================== LOGICAL ====================
  {
    name: "if",
    syntax: "if(condition, trueValue, falseValue)",
    description: "Returns trueValue if condition is true, otherwise falseValue.",
    example: 'if(1 > 0, "Yes", "No") → "Yes"',
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_logical_if.html"
  },
  {
    name: "and",
    syntax: "and(value1, value2, ...)",
    description: "Returns true if ALL values are true.",
    example: "and(true, true, false) → false",
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_logical_and.html"
  },
  {
    name: "or",
    syntax: "or(value1, value2, ...)",
    description: "Returns true if ANY value is true.",
    example: "or(true, false, false) → true",
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_logical_or.html"
  },
  {
    name: "not",
    syntax: "not(value)",
    description: "Returns the logical opposite of value.",
    example: "not(true) → false",
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_logical_not.html"
  },
  {
    name: "choose",
    syntax: "choose(index, value1, value2, ...)",
    description: "Returns the value at the specified index position.",
    example: 'choose(2, "a", "b", "c") → "b"',
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_logical_choose.html"
  },
  {
    name: "a!match",
    syntax: "a!match(value, equals, then, ...default)",
    description: "Pattern matching - returns result for first match.",
    example: 'a!match(local!status, equals: "A", then: "Active", equals: "I", then: "Inactive", default: "Unknown")',
    category: "Logical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_evaluation_a_match.html"
  },

  // ==================== LOOPING ====================
  {
    name: "a!forEach",
    syntax: "a!forEach(items, expression)",
    description: "Evaluates an expression for each item. Use fv!item, fv!index, fv!isFirst, fv!isLast.",
    example: 'a!forEach({1,2,3}, fv!item * 2) → {2, 4, 6}',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_a_foreach.html"
  },
  {
    name: "apply",
    syntax: "apply(function, array)",
    description: "Applies a function to each element of an array.",
    example: 'apply(fn!abs, {-1, 2, -3}) → {1, 2, 3}',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_apply.html"
  },
  {
    name: "reduce",
    syntax: "reduce(function, initial, array)",
    description: "Reduces an array to a single value using a function.",
    example: 'reduce(fn!sum, 0, {1, 2, 3}) → 6',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_reduce.html"
  },
  {
    name: "all",
    syntax: "all(predicate, array)",
    description: "Returns true if predicate is true for ALL items.",
    example: 'all(fn!isnull, {null, null}) → true',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_all.html"
  },
  {
    name: "any",
    syntax: "any(predicate, array)",
    description: "Returns true if predicate is true for ANY item.",
    example: 'any(fn!isnull, {1, null, 3}) → true',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_any.html"
  },
  {
    name: "none",
    syntax: "none(predicate, array)",
    description: "Returns true if predicate is false for ALL items.",
    example: 'none(fn!isnull, {1, 2, 3}) → true',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_none.html"
  },
  {
    name: "filter",
    syntax: "filter(predicate, array)",
    description: "Returns items where predicate is true.",
    example: "filter(fn!isnull, {1, null, 3}) → {null}",
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_filter.html"
  },
  {
    name: "reject",
    syntax: "reject(predicate, array)",
    description: "Returns items where predicate is false.",
    example: "reject(fn!isnull, {1, null, 3}) → {1, 3}",
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_reject.html"
  },
  {
    name: "repeat",
    syntax: "repeat(count, value)",
    description: "Creates an array with value repeated count times.",
    example: 'repeat(3, "x") → {"x", "x", "x"}',
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_repeat.html"
  },
  {
    name: "enumerate",
    syntax: "enumerate(start, end)",
    description: "Creates a sequence of integers from start to end.",
    example: "enumerate(1, 5) → {1, 2, 3, 4, 5}",
    category: "Looping",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_enumerate.html"
  },

  // ==================== MATHEMATICAL ====================
  {
    name: "sum",
    syntax: "sum(value1, value2, ...)",
    description: "Returns the sum of all values.",
    example: "sum(1, 2, 3, 4, 5) → 15",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_statistical_sum.html"
  },
  {
    name: "average",
    syntax: "average(value1, value2, ...)",
    description: "Returns the average of all values.",
    example: "average(10, 20, 30) → 20",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_statistical_average.html"
  },
  {
    name: "max",
    syntax: "max(value1, value2, ...)",
    description: "Returns the maximum value.",
    example: "max(5, 10, 3) → 10",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_statistical_max.html"
  },
  {
    name: "min",
    syntax: "min(value1, value2, ...)",
    description: "Returns the minimum value.",
    example: "min(5, 10, 3) → 3",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_statistical_min.html"
  },
  {
    name: "round",
    syntax: "round(number, [decimals])",
    description: "Rounds a number to the specified decimal places.",
    example: "round(3.14159, 2) → 3.14",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_round.html"
  },
  {
    name: "floor",
    syntax: "floor(number)",
    description: "Rounds down to the nearest integer.",
    example: "floor(3.9) → 3",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_floor.html"
  },
  {
    name: "ceiling",
    syntax: "ceiling(number)",
    description: "Rounds up to the nearest integer.",
    example: "ceiling(3.1) → 4",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_ceiling.html"
  },
  {
    name: "abs",
    syntax: "abs(number)",
    description: "Returns the absolute value.",
    example: "abs(-5) → 5",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_abs.html"
  },
  {
    name: "mod",
    syntax: "mod(number, divisor)",
    description: "Returns the remainder after division.",
    example: "mod(10, 3) → 1",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_mod.html"
  },
  {
    name: "power",
    syntax: "power(base, exponent)",
    description: "Returns base raised to the power of exponent.",
    example: "power(2, 3) → 8",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_power.html"
  },
  {
    name: "sqrt",
    syntax: "sqrt(number)",
    description: "Returns the square root.",
    example: "sqrt(16) → 4",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_sqrt.html"
  },
  {
    name: "rand",
    syntax: "rand()",
    description: "Returns a random decimal between 0 and 1.",
    example: "rand() → 0.7234...",
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_rand.html"
  },
  {
    name: "count",
    syntax: "count(array)",
    description: "Returns the number of items in an array.",
    example: 'count({"a", "b", "c"}) → 3',
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_statistical_count.html"
  },
  {
    name: "fixed",
    syntax: "fixed(number, decimals, [noCommas])",
    description: "Formats a number with fixed decimal places.",
    example: 'fixed(1234.567, 2) → "1,234.57"',
    category: "Mathematical",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_mathematical_fixed.html"
  },

  // ==================== PEOPLE ====================
  {
    name: "user",
    syntax: 'user(username, property)',
    description: "Returns user information by username.",
    example: 'user("john.doe", "firstName") → "John"',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_user.html"
  },
  {
    name: "group",
    syntax: 'group(groupId, property)',
    description: "Returns group information by ID.",
    example: 'group(123, "name") → "Administrators"',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_group.html"
  },
  {
    name: "loggedInUser",
    syntax: "loggedInUser()",
    description: "Returns the username of the currently logged-in user.",
    example: 'loggedInUser() → "john.doe"',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_loggedinuser.html"
  },
  {
    name: "isUserMemberOfGroup",
    syntax: "isUserMemberOfGroup(user, group)",
    description: "Checks if a user is a member of a group.",
    example: 'isUserMemberOfGroup(loggedInUser(), cons!ADMIN_GROUP)',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_isusermemberofgroup.html"
  },
  {
    name: "getDistinctUsers",
    syntax: "getDistinctUsers(usersAndGroups)",
    description: "Returns all unique users from users and groups.",
    example: 'getDistinctUsers({user1, user2, group1})',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_getdistinctusers.html"
  },
  {
    name: "a!userRecordLink",
    syntax: "a!userRecordLink(user)",
    description: "Creates a link to a user's record.",
    example: 'a!userRecordLink(user: loggedInUser())',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_userrecordlink.html"
  },
  {
    name: "supervisor",
    syntax: "supervisor(user, recursive)",
    description: "Returns the supervisor(s) of a user.",
    example: 'supervisor(loggedInUser(), false)',
    category: "People",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_people_supervisor.html"
  },

  // ==================== PROCESS ====================
  {
    name: "a!startProcess",
    syntax: "a!startProcess(processModel, processParameters, onSuccess, onError)",
    description: "Starts a process model from an interface.",
    example: 'a!startProcess(processModel: cons!MY_PROCESS, processParameters: {param1: local!value})',
    category: "Process",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_startprocess.html"
  },
  {
    name: "pp!",
    syntax: "pp!property",
    description: "Process properties - id, name, startTime, etc.",
    example: 'pp!id → 12345',
    category: "Process",
    docUrl: "https://docs.appian.com/suite/help/25.4/Process_and_Report_Data.html"
  },
  {
    name: "pv!",
    syntax: "pv!variableName",
    description: "Process variable reference.",
    example: 'pv!customerId → 123',
    category: "Process",
    docUrl: "https://docs.appian.com/suite/help/25.4/Process_Variables.html"
  },
  {
    name: "ac!",
    syntax: "ac!activityOutputName",
    description: "Activity class output reference.",
    example: 'ac!result',
    category: "Process",
    docUrl: "https://docs.appian.com/suite/help/25.4/Activity_Classes.html"
  },

  // ==================== RECORDS ====================
  {
    name: "recordType!",
    syntax: "recordType!RecordTypeName",
    description: "References a record type.",
    example: 'recordType!Employee',
    category: "Records",
    docUrl: "https://docs.appian.com/suite/help/25.4/record-type-object.html"
  },
  {
    name: "a!recordData",
    syntax: "a!recordData(recordType, filters)",
    description: "Creates record data for grids and charts.",
    example: 'a!recordData(recordType: recordType!Employee, filters: a!queryLogicalExpression(...))',
    category: "Records",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_recorddata.html"
  },
  {
    name: "a!relatedRecordData",
    syntax: "a!relatedRecordData(relationship, filters)",
    description: "Filters related record data.",
    example: 'a!relatedRecordData(relationship: recordType!Employee.relationships.department)',
    category: "Records",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_relatedrecorddata.html"
  },
  {
    name: "a!recordLink",
    syntax: "a!recordLink(recordType, identifier, label)",
    description: "Creates a link to a record.",
    example: 'a!recordLink(recordType: recordType!Employee, identifier: 123, label: "View")',
    category: "Records",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_recordlink.html"
  },
  {
    name: "a!recordActionField",
    syntax: "a!recordActionField(actions)",
    description: "Displays record actions as buttons.",
    example: 'a!recordActionField(actions: recordType!Employee.actions)',
    category: "Records",
    docUrl: "https://docs.appian.com/suite/help/25.4/Record_Action_Field.html"
  },

  // ==================== SCRIPTING ====================
  {
    name: "a!save",
    syntax: "a!save(target, value)",
    description: "Saves a value to a variable (use in saveInto).",
    example: 'a!save(local!items, append(local!items, local!newItem))',
    category: "Scripting",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_save.html"
  },
  {
    name: "a!refreshVariable",
    syntax: "a!refreshVariable(value, refreshOnInterval, refreshOnReferencedVarChange)",
    description: "Creates a variable that refreshes automatically.",
    example: 'a!refreshVariable(value: rule!getData(), refreshOnInterval: 60)',
    category: "Scripting",
    docUrl: "https://docs.appian.com/suite/help/25.4/Auto-Refresh_Variables.html"
  },
  {
    name: "load",
    syntax: "load(local!var: value, expression)",
    description: "Legacy - defines local variables. Use a!localVariables instead.",
    example: 'load(local!x: 10, local!x * 2)',
    category: "Scripting",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_load.html"
  },
  {
    name: "with",
    syntax: "with(local!var: value, expression)",
    description: "Legacy - defines local variables. Use a!localVariables instead.",
    example: 'with(local!x: 10, local!x * 2)',
    category: "Scripting",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_with.html"
  },
  {
    name: "error",
    syntax: "error(message)",
    description: "Throws an error with a message.",
    example: 'error("Value cannot be negative")',
    category: "Scripting",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_scripting_error.html"
  },

  // ==================== SYSTEM ====================
  {
    name: "rule!",
    syntax: "rule!ruleName(param1: value, ...)",
    description: "Calls an expression rule.",
    example: 'rule!calculateTotal(items: local!items)',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/Rules.html"
  },
  {
    name: "cons!",
    syntax: "cons!CONSTANT_NAME",
    description: "References a constant.",
    example: 'cons!MAX_RECORDS',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/Constants.html"
  },
  {
    name: "fn!",
    syntax: "fn!functionName",
    description: "References a built-in function (for use in apply, reduce, etc.).",
    example: 'apply(fn!upper, {"a", "b"}) → {"A", "B"}',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/Expressions.html"
  },
  {
    name: "ri!",
    syntax: "ri!ruleInputName",
    description: "References a rule input parameter.",
    example: 'ri!customerId',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/Rules.html"
  },
  {
    name: "local!",
    syntax: "local!variableName",
    description: "References a local variable.",
    example: 'local!selectedItems',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_evaluation_a_localvariables.html"
  },
  {
    name: "fv!",
    syntax: "fv!item, fv!index, fv!isFirst, fv!isLast",
    description: "forEach variables - current item, index, position flags.",
    example: 'a!forEach(items, fv!item & " at " & fv!index)',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_looping_a_foreach.html"
  },
  {
    name: "a!httpResponse",
    syntax: "a!httpResponse(statusCode, headers, body)",
    description: "Creates an HTTP response for web APIs.",
    example: 'a!httpResponse(statusCode: 200, body: local!data)',
    category: "System",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_httpresponse.html"
  },

  // ==================== TEXT ====================
  {
    name: "concat",
    syntax: "concat(value1, value2, ...)",
    description: "Concatenates multiple values into a single text string.",
    example: 'concat("Hello", " ", "World") → "Hello World"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_concat.html"
  },
  {
    name: "left",
    syntax: "left(text, numChars)",
    description: "Returns the specified number of characters from the beginning.",
    example: 'left("Appian", 3) → "App"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_left.html"
  },
  {
    name: "right",
    syntax: "right(text, numChars)",
    description: "Returns the specified number of characters from the end.",
    example: 'right("Appian", 3) → "ian"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_right.html"
  },
  {
    name: "mid",
    syntax: "mid(text, startIndex, numChars)",
    description: "Returns characters from the middle of a text string.",
    example: 'mid("Appian", 2, 3) → "ppi"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_mid.html"
  },
  {
    name: "len",
    syntax: "len(text)",
    description: "Returns the number of characters in a text string.",
    example: 'len("Appian") → 6',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_len.html"
  },
  {
    name: "upper",
    syntax: "upper(text)",
    description: "Converts text to uppercase.",
    example: 'upper("appian") → "APPIAN"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_upper.html"
  },
  {
    name: "lower",
    syntax: "lower(text)",
    description: "Converts text to lowercase.",
    example: 'lower("APPIAN") → "appian"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_lower.html"
  },
  {
    name: "proper",
    syntax: "proper(text)",
    description: "Capitalizes the first letter of each word.",
    example: 'proper("hello world") → "Hello World"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_proper.html"
  },
  {
    name: "trim",
    syntax: "trim(text)",
    description: "Removes leading and trailing whitespace.",
    example: 'trim("  hello  ") → "hello"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_trim.html"
  },
  {
    name: "split",
    syntax: "split(text, delimiter)",
    description: "Splits text into an array using the specified delimiter.",
    example: 'split("a,b,c", ",") → {"a", "b", "c"}',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_split.html"
  },
  {
    name: "find",
    syntax: "find(searchText, text, [startIndex])",
    description: "Returns the position of searchText within text (case-sensitive).",
    example: 'find("pp", "Appian") → 2',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_find.html"
  },
  {
    name: "search",
    syntax: "search(searchText, text, [startIndex])",
    description: "Returns the position of searchText within text (case-insensitive).",
    example: 'search("PP", "Appian") → 2',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_search.html"
  },
  {
    name: "substitute",
    syntax: "substitute(text, oldText, newText)",
    description: "Replaces occurrences of oldText with newText.",
    example: 'substitute("Hello World", "World", "Appian") → "Hello Appian"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_substitute.html"
  },
  {
    name: "text",
    syntax: "text(value, format)",
    description: "Formats a value as text using a pattern.",
    example: 'text(1234.5, "#,##0.00") → "1,234.50"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_text.html"
  },
  {
    name: "char",
    syntax: "char(number)",
    description: "Returns the character for the given ASCII code.",
    example: "char(65) → \"A\"",
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_char.html"
  },
  {
    name: "code",
    syntax: "code(text)",
    description: "Returns the ASCII code for the first character.",
    example: 'code("A") → 65',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_code.html"
  },
  {
    name: "clean",
    syntax: "clean(text)",
    description: "Removes non-printable characters from text.",
    example: 'clean("Hello\\nWorld") → "HelloWorld"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_clean.html"
  },
  {
    name: "exact",
    syntax: "exact(text1, text2)",
    description: "Case-sensitive comparison of two text values.",
    example: 'exact("Hello", "hello") → false',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_exact.html"
  },
  {
    name: "padleft",
    syntax: "padleft(text, length, padding)",
    description: "Pads text on the left to reach specified length.",
    example: 'padleft("42", 5, "0") → "00042"',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_padleft.html"
  },
  {
    name: "padright",
    syntax: "padright(text, length, padding)",
    description: "Pads text on the right to reach specified length.",
    example: 'padright("Hi", 5, ".") → "Hi..."',
    category: "Text",
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_text_padright.html"
  },
];

export const recipes = [
  {
    title: "Truncate text with ellipsis",
    description: "Truncate text after 50 characters and add ellipsis.",
    code: `if(
  len(ri!text) > 50,
  left(ri!text, 50) & "...",
  ri!text
)`,
    category: "Text"
  },
  {
    title: "Display full name from username",
    description: "Get a user's first and last name.",
    code: `if(
  isnull(ri!user),
  "",
  user(ri!user, "firstName") & " " & user(ri!user, "lastName")
)`,
    category: "People"
  },
  {
    title: "Next anniversary date",
    description: "Calculate the next anniversary from a start date.",
    code: `if(
  or(
    and(month(ri!start) <= month(today()), day(ri!start) <= day(today())),
    and(month(ri!start) < month(today()), day(ri!start) > day(today()))
  ),
  date(1 + year(today()), month(ri!start), day(ri!start)),
  date(year(today()), month(ri!start), day(ri!start))
)`,
    category: "Date & Time"
  },
  {
    title: "Check if datetime is within working hours",
    description: "Validate if a datetime falls between 6 AM and 5 PM.",
    code: `or(
  ri!dt > gmt(datetime(year(ri!dt), month(ri!dt), day(ri!dt), 17, 0, 0)),
  ri!dt < gmt(datetime(year(ri!dt), month(ri!dt), day(ri!dt), 6, 0, 0))
)`,
    category: "Date & Time"
  },
  {
    title: "Random integer in range",
    description: "Generate a random integer between min and max (inclusive).",
    code: `ri!min + tointeger(rand() * (ri!max - ri!min))`,
    category: "Mathematical"
  },
  {
    title: "Sort an array",
    description: "Sort any array in ascending order.",
    code: `todatasubset(
  a!forEach(ri!array, {value: fv!item}),
  a!pagingInfo(
    startIndex: 1,
    batchSize: -1,
    sort: a!sortInfo(field: "value", ascending: true)
  )
).data.value`,
    category: "Array"
  },
  {
    title: "Check if any array items exist in another",
    description: "Returns true if any item from one array exists in another.",
    code: `or(
  a!forEach(
    items: ri!originalArray,
    expression: contains(ri!compareArray, fv!item)
  )
)`,
    category: "Array"
  },
  {
    title: "Clear an array",
    description: "Remove all values from an array.",
    code: `ldrop(ri!array, count(ri!array))`,
    category: "Array"
  },
  {
    title: "Null-safe default value",
    description: "Return a default value if the input is null or empty.",
    code: `a!defaultValue(ri!value, "N/A")`,
    category: "Informational"
  },
  {
    title: "Filter grid data dynamically",
    description: "Apply multiple filters to a query based on user input.",
    code: `a!queryLogicalExpression(
  operator: "AND",
  filters: {
    a!queryFilter(field: "status", operator: "=", value: local!status),
    a!queryFilter(field: "department", operator: "=", value: local!dept)
  },
  ignoreFiltersWithEmptyValues: true
)`,
    category: "Data & Query"
  },
  {
    title: "Create title from any text",
    description: "Capitalizes first letter of each word, ignoring common words.",
    code: `a!localVariables(
  local!titleArray: split(trim(ri!title), " "),
  local!noCaps: {"a","an","the","at","by","in","of","up","as","and","but","or","for","nor","on","to","from"},
  concat(
    a!forEach(
      items: local!titleArray,
      expression: if(
        and(not(fv!isFirst), contains(local!noCaps, fv!item)),
        fv!item,
        proper(fv!item)
      ) & if(fv!isLast, "", " ")
    )
  )
)`,
    category: "Text"
  },
];

// ==================== QUERY RECIPES ====================
// Records-based queries (a!queryRecordType)
export const queryRecipesRecords = [
  {
    title: "Return fields for a single record",
    description: "Query specific fields from a single record by identifier.",
    code: `a!queryRecordByIdentifier(
  recordType: recordType!AR Customer,
  identifier: 1,
  fields: {
    recordType!AR Customer.fields.firstName,
    recordType!AR Customer.fields.lastName,
    recordType!AR Customer.fields.isActive
  }
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryrecordbyidentifier.html"
  },
  {
    title: "Return fields with related record data",
    description: "Query fields including data from related record types.",
    code: `a!queryRecordByIdentifier(
  recordType: recordType!AR Customer,
  identifier: 1,
  fields: {
    recordType!AR Customer.fields.firstName,
    recordType!AR Customer.fields.lastName,
    recordType!AR Customer.fields.isActive,
    recordType!AR Customer.relationships.region.fields.name
  }
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryrecordbyidentifier.html"
  },
  {
    title: "Aggregate data with grouping",
    description: "Get total orders per customer using COUNT aggregation.",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  fields: a!aggregationFields(
    groupings: {
      a!grouping(
        field: recordType!AR Order.relationships.customer.fields.displayName,
        alias: "customer"
      )
    },
    measures: {
      a!measure(
        function: "COUNT",
        field: recordType!AR Order.fields.id,
        alias: "order_count"
      )
    }
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 50)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Aggregate by date interval",
    description: "Count orders grouped by year using date interval.",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  fields: a!aggregationFields(
    groupings: a!grouping(
      field: recordType!AR Order.fields.submittedOn,
      alias: "yearAdded",
      interval: "YEAR"
    ),
    measures: a!measure(
      field: recordType!AR Order.fields.id,
      function: "COUNT",
      alias: "numberOfOrders"
    )
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 10)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Filter out null values",
    description: "Return only orders that have a shipped date (not null).",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  fields: {
    recordType!AR Order.fields.id,
    recordType!AR Order.fields.total,
    recordType!AR Order.fields.shipDate
  },
  filters: {
    a!queryFilter(
      field: recordType!AR Order.fields.shipDate,
      operator: "not null"
    )
  },
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 10,
    sort: a!sortInfo(
      field: recordType!AR Order.fields.shipDate,
      ascending: false
    )
  )
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Filter by multiple conditions (AND)",
    description: "Combine filters with AND logic using queryLogicalExpression.",
    code: `a!queryRecordType(
  recordType: recordType!AR Customer,
  fields: {
    recordType!AR Customer.fields.fullName,
    recordType!AR Customer.fields.createdOn,
    recordType!AR Customer.relationships.region.fields.value
  },
  filters: a!queryLogicalExpression(
    operator: "AND",
    filters: {
      a!queryFilter(
        field: recordType!AR Customer.fields.createdOn,
        operator: "between",
        value: {toDatetime(eomonth(today(),-1) + 1), now()}
      ),
      a!queryFilter(
        field: recordType!AR Customer.relationships.region.fields.value,
        operator: "=",
        value: "Midwest"
      )
    }
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 10)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Filter by one-to-many relationship",
    description: "Find customers with orders over $100,000 from a specific salesperson.",
    code: `a!queryRecordType(
  recordType: recordType!AR Customer,
  fields: a!aggregationFields(
    groupings: a!grouping(
      field: recordType!AR Customer.fields.fullName,
      alias: "customerName"
    )
  ),
  filters: {
    a!queryFilter(
      field: recordType!AR Customer.relationships.order.fields.salesPerson,
      operator: "=",
      value: 275
    ),
    a!queryFilter(
      field: recordType!AR Customer.relationships.order.fields.total,
      operator: ">",
      value: 100000
    )
  },
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 100)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Filter between two dates",
    description: "Return orders created within a specific date range.",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  fields: recordType!AR Order.fields.id,
  filters: a!queryFilter(
    field: recordType!AR Order.fields.submittedOn,
    operator: "between",
    value: todatetime({"06/08/2019", "06/09/2019"})
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 10)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Exclude values with NOT IN",
    description: "Return orders excluding specific regions.",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  fields: {
    recordType!AR Order.fields.id,
    recordType!AR Order.relationships.region.fields.countryRegionCode
  },
  filters: a!queryFilter(
    field: recordType!AR Order.relationships.region.fields.countryRegionCode,
    operator: "not in",
    value: {"FR", "DE", "AU", "GB"}
  ),
  pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 10)
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Sort on multiple fields",
    description: "Return top customers sorted by products purchased, then by sales total.",
    code: `a!queryRecordType(
  recordType: recordType!AR Customer,
  fields: {
    recordType!AR Customer.fields.fullName,
    recordType!AR Customer.fields.uniqueNumberOfProducts,
    recordType!AR Customer.fields.sumOfSales
  },
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 5,
    sort: {
      a!sortInfo(
        field: recordType!AR Customer.fields.uniqueNumberOfProducts,
        ascending: false
      ),
      a!sortInfo(
        field: recordType!AR Customer.fields.sumOfSales,
        ascending: false
      )
    }
  )
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
  {
    title: "Sort aggregation with measure filter",
    description: "Return US territories with most online orders, filtering in the measure.",
    code: `a!queryRecordType(
  recordType: recordType!AR Order,
  filters: a!queryFilter(
    field: recordType!AR Order.relationships.region.fields.countryRegionCode,
    operator: "=",
    value: "US"
  ),
  fields: a!aggregationFields(
    groupings: {
      a!grouping(
        field: recordType!AR Order.relationships.region.fields.territory,
        alias: "territory"
      )
    },
    measures: a!measure(
      field: recordType!AR Order.fields.onlineOrder,
      function: "COUNT",
      filters: a!queryFilter(
        field: recordType!AR Order.fields.onlineOrder,
        operator: "=",
        value: true
      ),
      alias: "onlineOrderCount"
    )
  ),
  pagingInfo: a!pagingInfo(
    startIndex: 1,
    batchSize: 5,
    sort: a!sortInfo(field: "onlineOrderCount", ascending: false)
  )
).data`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_queryrecordtype.html"
  },
];

// Entity-based queries (a!queryEntity)
export const queryRecipesEntity = [
  {
    title: "Retrieve all fields (with cast)",
    description: "Query all fields and cast result to CDT type.",
    code: `cast(
  type!Employee,
  a!queryEntity(
    entity: cons!EMPLOYEE_ENTITY,
    query: a!query(
      logicalExpression: a!queryLogicalExpression(
        operator: "AND",
        filters: {
          a!queryFilter(field: "id", operator: "=", value: 8)
        }
      ),
      pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 1)
    )
  ).data
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Retrieve a single field",
    description: "Query only the phone number field for a specific employee.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: {
        a!queryColumn(field: "phoneNumber")
      }
    ),
    logicalExpression: a!queryLogicalExpression(
      operator: "AND",
      filters: {
        a!queryFilter(field: "id", operator: "=", value: 8)
      }
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: 1)
  )
).data.phoneNumber[1]`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Get distinct values",
    description: "Get unique list of departments using aggregation grouping.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    aggregation: a!queryAggregation(
      aggregationColumns: {
        a!queryAggregationColumn(
          field: "department",
          isGrouping: true
        )
      }
    ),
    pagingInfo: a!pagingInfo(
      startIndex: 1,
      batchSize: -1,
      sort: a!sortInfo(field: "department", ascending: true)
    )
  )
).data.department`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Count by group",
    description: "Count employees per department.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    aggregation: a!queryAggregation(
      aggregationColumns: {
        a!queryAggregationColumn(
          field: "department",
          isGrouping: true
        ),
        a!queryAggregationColumn(
          field: "department",
          alias: "numberOfEmployees",
          aggregationFunction: "COUNT"
        )
      }
    ),
    pagingInfo: a!pagingInfo(
      startIndex: 1,
      batchSize: -1,
      sort: a!sortInfo(field: "department", ascending: true)
    )
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Aggregate by year and month",
    description: "Count employees by start date year and month.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    aggregation: a!queryAggregation(
      aggregationColumns: {
        a!queryAggregationColumn(
          field: "startDate",
          alias: "year_startDate",
          isGrouping: true,
          groupingFunction: "YEAR"
        ),
        a!queryAggregationColumn(
          field: "startDate",
          alias: "month_startDate",
          isGrouping: true,
          groupingFunction: "MONTH"
        ),
        a!queryAggregationColumn(
          field: "id",
          alias: "idCount",
          aggregationFunction: "COUNT"
        )
      }
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: -1)
  ),
  fetchTotalCount: true
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Query with OR conditions",
    description: "Find employees who started recently OR have 'Associate' in title.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: {
        a!queryColumn(field: "firstName"),
        a!queryColumn(field: "lastName")
      }
    ),
    logicalExpression: a!queryLogicalExpression(
      operator: "OR",
      filters: {
        a!queryFilter(
          field: "startDate",
          operator: ">",
          value: date(year(now())-2, month(now()), day(now()))
        ),
        a!queryFilter(
          field: "title",
          operator: "includes",
          value: "Associate"
        )
      },
      ignoreFiltersWithEmptyValues: true
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: -1)
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Nested logical expressions",
    description: "Complex query: Engineering dept AND (Director OR 10+ years tenure).",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: {
        a!queryColumn(field: "firstName"),
        a!queryColumn(field: "lastName")
      }
    ),
    logicalExpression: a!queryLogicalExpression(
      operator: "AND",
      filters: a!queryFilter(
        field: "department",
        operator: "=",
        value: "Engineering"
      ),
      logicalExpressions: {
        a!queryLogicalExpression(
          operator: "OR",
          filters: {
            a!queryFilter(
              field: "startDate",
              operator: "<",
              value: date(year(now())-10, month(now()), day(now()))
            ),
            a!queryFilter(
              field: "title",
              operator: "includes",
              value: "Director"
            )
          },
          ignoreFiltersWithEmptyValues: true
        )
      },
      ignoreFiltersWithEmptyValues: true
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: -1)
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Filter for null values",
    description: "Find employees missing required fields.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: {
        a!queryColumn(field: "firstName"),
        a!queryColumn(field: "lastName")
      }
    ),
    logicalExpression: a!queryLogicalExpression(
      operator: "OR",
      filters: {
        a!queryFilter(field: "firstName", operator: "is null"),
        a!queryFilter(field: "lastName", operator: "is null"),
        a!queryFilter(field: "department", operator: "is null"),
        a!queryFilter(field: "phoneNumber", operator: "is null")
      },
      ignoreFiltersWithEmptyValues: true
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: -1)
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Filter for null or empty",
    description: "Find employees with null or empty firstName.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: { a!queryColumn(field: "firstName") }
    ),
    logicalExpression: a!queryLogicalExpression(
      operator: "OR",
      filters: {
        a!queryFilter(field: "firstName", operator: "is null"),
        a!queryFilter(field: "firstName", operator: "in", value: {""})
      }
    ),
    pagingInfo: a!pagingInfo(startIndex: 1, batchSize: -1)
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Dynamic search with optional filters",
    description: "Search employees with optional lastName, title, department filters.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    logicalExpression: a!queryLogicalExpression(
      operator: "AND",
      filters: {
        a!queryFilter(
          field: "lastName",
          operator: "includes",
          value: ri!lastName
        ),
        a!queryFilter(
          field: "title",
          operator: "includes",
          value: ri!title
        ),
        a!queryFilter(
          field: "department",
          operator: "=",
          value: ri!department
        )
      },
      ignoreFiltersWithEmptyValues: true
    ),
    pagingInfo: ri!pagingInfo
  ),
  fetchTotalCount: true
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Sort on multiple fields (selection)",
    description: "Sort by department, then by title (even if not selected).",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    selection: a!querySelection(
      columns: {
        a!queryColumn(field: "department"),
        a!queryColumn(field: "firstName"),
        a!queryColumn(field: "lastName")
      }
    ),
    pagingInfo: a!pagingInfo(
      startIndex: 1,
      batchSize: 20,
      sort: {
        a!sortInfo(field: "department", ascending: true),
        a!sortInfo(field: "title", ascending: true)
      }
    )
  ),
  fetchTotalCount: true
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
  {
    title: "Sort on multiple fields (aggregation)",
    description: "Count employees by dept/title, sorted by both.",
    code: `a!queryEntity(
  entity: cons!EMPLOYEE_ENTITY,
  query: a!query(
    aggregation: a!queryAggregation(
      aggregationColumns: {
        a!queryAggregationColumn(field: "department", isGrouping: true),
        a!queryAggregationColumn(field: "title", isGrouping: true),
        a!queryAggregationColumn(
          field: "lastName",
          aggregationFunction: "COUNT"
        )
      }
    ),
    pagingInfo: a!pagingInfo(
      startIndex: 1,
      batchSize: 20,
      sort: {
        a!sortInfo(field: "department", ascending: true),
        a!sortInfo(field: "title", ascending: true)
      }
    )
  )
)`,
    docUrl: "https://docs.appian.com/suite/help/25.4/fnc_system_a_queryentity.html"
  },
];
