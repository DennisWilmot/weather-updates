import { groq } from "@ai-sdk/groq";
import { streamText, tool, convertToModelMessages } from "ai";
import { z } from "zod";
import { executeQuery } from "@/lib/db-query-tool";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Ensure GROQ_API_KEY is set from GROQ_KEY if needed
// The groq() function reads from process.env.GROQ_API_KEY
if (process.env.GROQ_KEY && !process.env.GROQ_API_KEY) {
  process.env.GROQ_API_KEY = process.env.GROQ_KEY;
}

// Validation helpers
function validatePlotData(data: any): {
  valid: boolean;
  error?: string;
  suggestion?: string;
} {
  if (!data) {
    return {
      valid: false,
      error: "Data is required",
      suggestion:
        "Please provide data as an array of objects or array of arrays",
    };
  }
  if (!Array.isArray(data)) {
    return {
      valid: false,
      error: "Data must be an array",
      suggestion: "Convert your data to an array format",
    };
  }
  if (data.length === 0) {
    return {
      valid: false,
      error: "Data array is empty",
      suggestion: "Please provide data with at least one item",
    };
  }
  return { valid: true };
}

function validateTableData(
  headers: string[],
  rows: (string | number)[][]
): { valid: boolean; error?: string; suggestion?: string } {
  if (!headers || headers.length === 0) {
    return {
      valid: false,
      error: "Table headers are required",
      suggestion: "Provide at least one column header",
    };
  }
  if (!rows || rows.length === 0) {
    return {
      valid: false,
      error: "Table rows are required",
      suggestion: "Provide at least one row of data",
    };
  }
  const headerCount = headers.length;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) {
      return {
        valid: false,
        error: `Row ${i + 1} is not an array`,
        suggestion: "Each row must be an array of cell values",
      };
    }
    if (row.length !== headerCount) {
      return {
        valid: false,
        error: `Row ${i + 1} has ${row.length} columns, but headers has ${headerCount} columns`,
        suggestion: `Ensure all rows have exactly ${headerCount} columns to match the headers`,
      };
    }
  }
  return { valid: true };
}

export async function POST(req: Request) {
  try {
    let { messages } = await req.json();
    messages = messages.map((msg: any) => {
      if (msg.role === "user") {
        return {
          role: "user",
          content:
            typeof msg.content === "string"
              ? msg.content
              : Array.isArray(msg.content)
                ? msg.content.map((c: any) => c.text).join(" ")
                : String(msg.content ?? ""),
        };
      }

      // ✅ NEVER trust frontend tool/assistant messages
      // ✅ Only allow them if they are already in ModelMessage format
      return msg;
    });

    // Validate messages array
    if (!Array.isArray(messages)) {
      console.error(
        "[Chat API] ERROR: messages is not an array!",
        typeof messages
      );
      throw new Error("Messages must be an array");
    }

    // Preprocess messages to ensure proper format for AI SDK
    const preprocessedMessages = messages
      .map((msg: any, index: number) => {
        if (!msg) {
          console.error(
            `[CONTENT DEBUG] Message ${index} is undefined or null!`
          );
          return null;
        }

        if (!msg.role) {
          console.error(
            `[CONTENT DEBUG] Message ${index} has no role!`,
            JSON.stringify(msg, null, 2)
          );
          return null;
        }

        // Log input content format
        console.log(`[CONTENT DEBUG] Message ${index} (${msg.role}) INPUT:`, {
          contentType: typeof msg.content,
          isArray: Array.isArray(msg.content),
          arrayLength: Array.isArray(msg.content) ? msg.content.length : null,
          firstItemType: Array.isArray(msg.content)
            ? typeof msg.content[0]
            : null,
          firstItemKeys:
            Array.isArray(msg.content) &&
            msg.content[0] &&
            typeof msg.content[0] === "object"
              ? Object.keys(msg.content[0])
              : null,
          contentPreview:
            typeof msg.content === "string"
              ? msg.content.substring(0, 100)
              : Array.isArray(msg.content)
                ? `Array[${msg.content.length}]`
                : JSON.stringify(msg.content).substring(0, 100),
        });
        // If it's an assistant message with toolCalls, ensure proper format
        if (msg.role === "assistant" && msg.toolCalls) {
          let content: string;
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content) && msg.content[0]?.text) {
            // Extract text from array format
            content = msg.content[0].text;
          } else if (
            Array.isArray(msg.content) &&
            typeof msg.content[0] === "string"
          ) {
            // If it's an array of strings, join them
            content = msg.content.join(" ");
          } else {
            // Fallback: empty string or convert to string
            content = msg.content
              ? typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content)
              : "";
          }
          const result = {
            role: "assistant" as const,
            content: content,
            toolCalls: msg.toolCalls.map((tc: any) => ({
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
            })),
          };
          console.log(
            `[CONTENT DEBUG] Message ${index} (assistant with toolCalls) OUTPUT:`,
            {
              contentType: typeof result.content,
              isArray: Array.isArray(result.content),
              contentValue: result.content,
              toolCallsCount: result.toolCalls.length,
            }
          );
          return result;
        }
        // If it's a tool message, format it properly
        if (msg.role === "tool") {
          // let parsedOutput: any = msg.content;

          // // If content is a JSON string, parse it
          // if (typeof msg.content === "string") {
          //   try {
          //     parsedOutput = JSON.parse(msg.content);
          //   } catch {
          //     parsedOutput = msg.content;
          //   }
          // }

          // const result = {
          //   role: "tool" as const,
          //   content: [
          //     {
          //       type: "tool-result" as const,
          //       toolCallId: msg.toolCallId ?? msg.content?.[0]?.toolCallId,
          //       toolName: msg.toolName ?? msg.content?.[0]?.toolName,
          //       output: parsedOutput,
          //     },
          //   ],
          // };

          // console.log(`[CONTENT DEBUG] Message ${index} (tool) FIXED OUTPUT:`, {
          //   isArray: Array.isArray(result.content),
          //   firstItemKeys: Object.keys(result.content[0]),
          // });

          return msg;
        }

        // For user messages, ensure content is a string (streamText expects strings)
        if (msg.role === "user") {
          let content: string;
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content) && msg.content[0]?.text) {
            // Extract text from array format
            content = msg.content[0].text;
          } else if (
            Array.isArray(msg.content) &&
            typeof msg.content[0] === "string"
          ) {
            // If it's an array of strings, join them
            content = msg.content.join(" ");
          } else {
            // Fallback: convert to string
            content =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);
          }
          const result = {
            role: "user" as const,
            content: content,
          };
          console.log(`[CONTENT DEBUG] Message ${index} (user) OUTPUT:`, {
            contentType: typeof result.content,
            isArray: Array.isArray(result.content),
            contentValue: result.content.substring(0, 100),
          });
          return result;
        }
        // For assistant messages without toolCalls, ensure content is a string
        if (msg.role === "assistant") {
          let content: string;
          if (typeof msg.content === "string") {
            content = msg.content;
          } else if (Array.isArray(msg.content) && msg.content[0]?.text) {
            // Extract text from array format
            content = msg.content[0].text;
          } else if (
            Array.isArray(msg.content) &&
            typeof msg.content[0] === "string"
          ) {
            // If it's an array of strings, join them
            content = msg.content.join(" ");
          } else {
            // Fallback: empty string or convert to string
            content = msg.content
              ? typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content)
              : "";
          }
          const result = {
            role: "assistant" as const,
            content: content,
          };
          console.log(`[CONTENT DEBUG] Message ${index} (assistant) OUTPUT:`, {
            contentType: typeof result.content,
            isArray: Array.isArray(result.content),
            contentValue: result.content.substring(0, 100),
          });
          return result;
        }
        // For any other message type, return as-is
        return msg;
      })
      .filter((msg: any) => msg !== null); // Remove any null messages

    const convertedMessages = preprocessedMessages;

    // Log final message structure before passing to streamText
    console.log("[CONTENT DEBUG] Final messages being passed to streamText:", {
      count: convertedMessages.length,
      messages: convertedMessages.map((msg: any, idx: number) => ({
        index: idx,
        role: msg.role,
        contentType: typeof msg.content,
        isArray: Array.isArray(msg.content),
        contentPreview:
          typeof msg.content === "string"
            ? msg.content.substring(0, 100)
            : Array.isArray(msg.content)
              ? `Array[${msg.content.length}] with first item: ${JSON.stringify(msg.content[0]).substring(0, 100)}`
              : JSON.stringify(msg.content).substring(0, 100),
        hasToolCalls: !!msg.toolCalls,
        toolCallId: msg.toolCallId,
        toolName: msg.toolName,
      })),
    });

    // Verify API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_KEY or GROQ_API_KEY environment variable is not set");
      return new Response("Groq API key is not configured", { status: 500 });
    }

    // Define Observable Plot tool
    const plotParamsSchema = z.object({
      data: z
        .any()
        .describe(
          "The data to visualize. Can be an array of objects or array of arrays."
        ),
      plotType: z
        .enum(["line", "bar", "area", "scatter", "histogram", "pie"])
        .describe("The type of plot to generate"),
      title: z.string().optional().describe("Title for the plot"),
      xLabel: z.string().optional().describe("Label for the x-axis"),
      yLabel: z.string().optional().describe("Label for the y-axis"),
      xField: z
        .string()
        .optional()
        .describe("Field name for x-axis data (if data is array of objects)"),
      yField: z
        .string()
        .optional()
        .describe("Field name for y-axis data (if data is array of objects)"),
      width: z
        .number()
        .optional()
        .describe("Width of the plot in pixels (default: 800)"),
      height: z
        .number()
        .optional()
        .describe("Height of the plot in pixels (default: 600)"),
      colorScheme: z.string().optional().describe("Color scheme for the plot"),
    });

    const observablePlotTool = tool({
      description: `Generate data visualizations and plots using Observable Plot. 
        Use this tool when the user asks to create charts, graphs, visualizations, or plots.
        
        SUPPORTED PLOT TYPES: line, bar, area, scatter, histogram, pie
        - Note: Pie charts are automatically converted to bar charts
        
        DATA FORMATS:
        - Array of objects: [{x: 1, y: 10}, {x: 2, y: 20}]
        - Array of arrays: [[1, 10], [2, 20]] (first row can be headers)
        
        CRITICAL: If you receive data from db_query tool, you MUST extract the data array from the result.
        The db_query result has structure: {type: "db_query_result", data: [...], ...}
        You must use result.data (the array), NOT the entire result object.`,
      inputSchema: plotParamsSchema,
      execute: async (params) => {
        // Validate and normalize data
        let data = params.data;

        // If data is a string (JSON), try to parse it (might be a tool result from message history)
        if (typeof data === "string") {
          try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === "object") {
              data = parsed;
            }
          } catch (e) {
            // Not valid JSON, keep as string
          }
        }

        // If data is from a db_query result, extract the data array
        if (data && typeof data === "object" && !Array.isArray(data)) {
          // Check if this is a db_query tool call (has function_name or args with query)
          if (
            data.function_name === "db_query" ||
            (data.args &&
              Array.isArray(data.args) &&
              data.args.some((arg: any) => arg.query))
          ) {
            return {
              type: "error",
              error: "Cannot use db_query tool call as chart data",
              suggestion:
                "You must first execute the db_query tool to get the query results, then use the 'data' array from the query result to create the chart. The workflow is: 1) Call db_query with your SQL, 2) Wait for the result, 3) Extract result.data (the array), 4) Format it as [{x: 'Category', y: count}, ...], 5) Pass the formatted array to observable_plot.",
              tool: "observable_plot",
            };
          }

          // If data is from a db_query result, extract the data array and auto-format
          if (data.type === "db_query_result" && Array.isArray(data.data)) {
            const queryData = data.data;
            // Auto-format: if data has 'type' and 'count' fields, convert to chart format
            if (
              queryData.length > 0 &&
              queryData[0].type &&
              queryData[0].count !== undefined
            ) {
              data = queryData.map((row: any) => ({
                x: String(row.type || ""),
                y: Number(row.count || 0),
              }));
            } else if (
              queryData.length > 0 &&
              Object.keys(queryData[0]).length >= 2
            ) {
              // Generic formatting: use first two columns as x and y
              const keys = Object.keys(queryData[0]);
              data = queryData.map((row: any) => ({
                x: String(row[keys[0]] || ""),
                y: Number(row[keys[1]] || 0),
              }));
            } else {
              // Just use the data array as-is
              data = queryData;
            }
          } else if (data.data && Array.isArray(data.data)) {
            // Handle nested data property
            data = data.data;
          } else {
            // Try to convert object to array format
            const validation = validatePlotData(data);
            if (!validation.valid) {
              return {
                type: "error",
                error: validation.error || "Invalid data format",
                suggestion:
                  validation.suggestion ||
                  "Data must be an array. If you got this from a database query, extract the 'data' array from the query result.",
                tool: "observable_plot",
              };
            }
          }
        }

        // Validate the data is an array
        const validation = validatePlotData(data);
        if (!validation.valid) {
          return {
            type: "error",
            error: validation.error || "Invalid data format",
            suggestion:
              validation.suggestion ||
              "Data must be an array. If you got this from a database query, extract the 'data' array from the query result.",
            tool: "observable_plot",
          };
        }

        // Auto-detect xField and yField if not provided and data is formatted as {x, y}
        let xField = params.xField;
        let yField = params.yField;
        if (!xField || (!yField && Array.isArray(data) && data.length > 0)) {
          const firstItem = data[0];
          if (firstItem && typeof firstItem === "object") {
            if (firstItem.x !== undefined && firstItem.y !== undefined) {
              xField = xField || "x";
              yField = yField || "y";
            } else {
              // Use first two keys as x and y
              const keys = Object.keys(firstItem);
              if (keys.length >= 2) {
                xField = xField || keys[0];
                yField = yField || keys[1];
              }
            }
          }
        }

        // Return the plot configuration
        return {
          type: "observable-plot",
          data: data,
          plotType: params.plotType || "bar",
          title: params.title,
          xLabel: params.xLabel,
          yLabel: params.yLabel,
          xField: xField,
          yField: yField,
          width: params.width,
          height: params.height,
          colorScheme: params.colorScheme,
        };
      },
    });

    // Define Table tool
    const tableParamsSchema = z.object({
      headers: z.array(z.string()).describe("Array of column header names"),
      rows: z
        .array(z.array(z.union([z.string(), z.number()])))
        .describe(
          "Array of table rows, where each row is an array of cell values"
        ),
      title: z.string().optional().describe("Optional title for the table"),
    });

    const tableTool = tool({
      description: `Generate a table to display tabular data.
        Use this tool when the user asks to create a table, show data in a table format, or display tabular information.`,
      inputSchema: tableParamsSchema,
    });

    // Define PDF Document tool
    const pdfDocumentSchema = z.object({
      title: z.string().describe("Title of the PDF document"),
      sections: z
        .array(
          z.object({
            type: z
              .enum(["text", "chart", "table"])
              .describe("Type of section: text paragraph, chart, or table"),
            content: z
              .string()
              .optional()
              .describe("Text content for text sections"),
            chartData: plotParamsSchema
              .optional()
              .describe(
                "Chart data and configuration if this is a chart section"
              ),
            tableData: z
              .object({
                headers: z
                  .array(z.string())
                  .describe("Array of column header names"),
                rows: z
                  .array(z.array(z.union([z.string(), z.number()])))
                  .describe("Array of table rows"),
                title: z
                  .string()
                  .optional()
                  .describe("Optional title for the table"),
              })
              .optional()
              .describe("Table data if this is a table section"),
          })
        )
        .describe("Array of sections to include in the PDF"),
      filename: z
        .string()
        .optional()
        .describe("Filename for the PDF (without extension)"),
    });

    const pdfDocumentTool = tool({
      description: `Generate a complete PDF document with multiple charts, text paragraphs, and tables.
        Use this tool when the user asks to create a PDF document with multiple charts, text, or tables.`,
      inputSchema: pdfDocumentSchema,
      execute: async (params) => {
        // Return the PDF structure for frontend rendering
        return {
          type: "pdf-document",
          title: params.title,
          sections: params.sections,
          filename:
            params.filename || params.title.toLowerCase().replace(/\s+/g, "-"),
        };
      },
    });

    // Define Database Query tool
    const dbQuerySchema = z.object({
      query: z
        .string()
        .describe(
          "The SQL SELECT query to execute. Must be a read-only SELECT statement."
        ),
      description: z
        .string()
        .optional()
        .describe("Optional description of what data this query retrieves"),
    });

    const dbQueryTool = tool({
      description: `Query the database to retrieve data. Use this tool when the user asks questions about data in the system, such as:
        - Statistics about people, needs, skills, or resources
        - Information about parishes, communities, or locations
        - Data about forms, submissions, or assets
        - Any other data-related questions that require querying the database
        
        IMPORTANT: 
        - Only SELECT queries are allowed (read-only)
        - The query will be automatically validated for safety
        - You must write valid PostgreSQL SQL
        - Use proper table and column names from the database schema
        - You MUST provide the 'query' parameter with a valid SQL SELECT statement`,
      inputSchema: dbQuerySchema,
      execute: async (params) => {
        try {
          // Validate that query parameter exists
          if (!params.query || typeof params.query !== "string") {
            console.error(
              "[Chat API] db_query tool called without query parameter:",
              params
            );
            return {
              type: "error",
              error:
                "Missing required 'query' parameter. You must provide a SQL SELECT query.",
              tool: "db_query",
            };
          }

          const result = await executeQuery(params.query);

          if (!result.success) {
            return {
              type: "error",
              error: result.error || "Query execution failed",
              tool: "db_query",
            };
          }

          return {
            type: "db_query_result",
            data: result.data || [],
            rowCount: result.rowCount || 0,
            columns: result.columns || [],
            description: params.description,
          };
        } catch (error: any) {
          console.error("Database query tool error:", error);
          return {
            type: "error",
            error: error?.message || "Failed to execute database query",
            tool: "db_query",
          };
        }
      },
    });

    // ✅ FINAL NORMALIZATION - Keep messages in ModelMessage format (not UI format)
    // streamText expects ModelMessage format: content as string, not array
    // const safeMessages = convertedMessages.map((msg: any) => {
    //   // ✅ USER MESSAGE → ensure content is string
    //   if (msg.role === "user") {
    //     return {
    //       role: "user" as const,
    //       content:
    //         typeof msg.content === "string"
    //           ? msg.content
    //           : Array.isArray(msg.content) && msg.content[0]?.text
    //             ? msg.content[0].text
    //             : String(msg.content ?? ""),
    //     };
    //   }

    //   // ✅ ASSISTANT MESSAGE → ensure content is string and toolCalls are properly formatted
    //   if (msg.role === "assistant") {
    //     const normalizedToolCalls = Array.isArray(msg.toolCalls)
    //       ? msg.toolCalls
    //           .map((tc: any) => {
    //             // Ensure toolCalls have correct structure
    //             if (typeof tc === "object" && tc !== null) {
    //               return {
    //                 toolCallId: String(tc.toolCallId ?? ""),
    //                 toolName: String(tc.toolName ?? ""),
    //                 args: tc.args || {},
    //               };
    //             }
    //             return null;
    //           })
    //           .filter((tc: any) => tc !== null)
    //       : [];

    //     return {
    //       role: "assistant" as const,
    //       content:
    //         typeof msg.content === "string"
    //           ? msg.content
    //           : Array.isArray(msg.content) && msg.content[0]?.text
    //             ? msg.content[0].text
    //             : String(msg.content ?? ""),
    //       ...(normalizedToolCalls.length > 0 && {
    //         toolCalls: normalizedToolCalls,
    //       }),
    //     };
    //   }

    //   // ✅ TOOL MESSAGE → ensure content is string format
    //   if (msg.role === "tool") {
    //     return msg;
    //   }

    //   return msg;
    // });

    // console.log("[CONTENT DEBUG] Final safeMessages before streamText:", {
    //   count: safeMessages.length,
    //   sample: safeMessages.map((msg: any) => ({
    //     role: msg.role,
    //     contentType: typeof msg.content,
    //     hasToolCalls: !!msg.toolCalls,
    //     toolCallsSample: msg.toolCalls?.[0]
    //       ? {
    //           toolCallId: msg.toolCalls[0].toolCallId,
    //           toolName: msg.toolCalls[0].toolName,
    //           argsKeys: Object.keys(msg.toolCalls[0].args || {}),
    //         }
    //       : null,
    //   })),
    // });

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      messages: convertedMessages,
      system: `You are Atlas, a helpful AI assistant for the Office of Disaster Preparedness and Emergency Management (ODPEM) logistics system.

When users greet you or ask general questions, respond in a friendly and welcoming manner. Proactively suggest what you can help with:

- **Database Queries**: I can query the database to retrieve information about people, needs, skills, resources, parishes, communities, forms, submissions, assets, and more
- **Data Visualization**: I can create charts and graphs (bar, line, area, scatter, histogram) to visualize your data
- **Tables**: I can display data in organized tables for easy viewing
- **PDF Reports**: I can generate professional PDF documents with charts, tables, and text sections

When a user's request doesn't require any tools (like a simple greeting), respond naturally and warmly, then briefly mention how you can help them with data analysis, visualizations, or report generation.

Use tools when appropriate:
- Use the db_query tool when users ask questions about data in the system. Generate a SQL SELECT query to retrieve the needed information. The query will be automatically validated for safety (read-only only).
- Use the observable_plot tool for creating charts and visualizations from data
- Use the table tool for displaying tabular data
- Use the pdf_document tool when users want a complete PDF report with multiple sections

CRITICAL VISUALIZATION LOGIC:

There are TWO valid chart workflows. You MUST determine which workflow applies based on whether there is existing query data in the message history.

✅ WORKFLOW A — FIRST-TIME CHART REQUEST (NO PREVIOUS QUERY)

If the user asks to make a chart AND there is NO previous db_query tool result in the message history:

1. You MUST first call the db_query tool with a valid SQL SELECT statement to retrieve the required data.
2. Wait for the db_query tool result.
3. Extract result.data from the tool output. The result structure is: {type: "db_query_result", data: [{type: "aid_worker", count: 10}, ...], rowCount: number, columns: [...], description: "..."}
4. Format the data for the chart by converting each row to chart format:
   - If the query returns [{type: "aid_worker", count: 10}, {type: "person_in_need", count: 5}]
   - Convert to: [{x: "Aid Worker", y: 10}, {x: "Person in Need", y: 5}]
   - Use the actual field names from your query (e.g., if you have "type" and "count", map them to x and y)
5. THEN call observable_plot tool with the formatted data array and appropriate fields:
   - data: [{x: "Aid Worker", y: 10}, {x: "Person in Need", y: 5}]
   - xField: "x"
   - yField: "y"
   - plotType: "bar" (or appropriate type)
   - title: "Types of People in System" (or appropriate)
   - xLabel: "Type" (or first column name)
   - yLabel: "Count" (or second column name)

✅ WORKFLOW B — VISUALIZE EXISTING QUERY RESULT

If the user asks to visualize AND there IS a previous db_query tool result in the message history:

1. Search backwards through the messages array for the most recent message where role === "tool" and toolName === "db_query"
2. Extract the tool result from message.content[0].output (already parsed as an object, not a string)
   - Access it: const result = message.content[0].output
   - The result will have structure: {type: "db_query_result", data: [{type: "field_agent", count: 6}, ...], rowCount: 9, columns: ["type", "count"]}
3. Extract and format the data:
   - Extract: const dataArray = result.data
   - Format for chart: dataArray.map(row => ({x: String(row.type || row[Object.keys(row)[0]]), y: Number(row.count || row[Object.keys(row)[1]] || 0)}))
   - Example: [{type: "field_agent", count: 6}] becomes [{x: "field_agent", y: 6}]
4. Call observable_plot tool IMMEDIATELY with the formatted data:
   - Do NOT respond with text
   - Do NOT ask questions
   - Do NOT re-query the database
   - Call observable_plot with:
     * data: the formatted array from step 3
     * plotType: "bar"
     * xField: "x"
     * yField: "y"
     * title: "Types of People in System" (or appropriate)
     * xLabel: "Type" (or first column name)
     * yLabel: "Count" (or second column name)

🚨 CRITICAL RULES FOR BOTH WORKFLOWS:
- NEVER call observable_plot unless you already have a real data array.
- NEVER attempt to call observable_plot with empty args.
- If no data is available yet, always choose db_query before any visualization tool.
- You MUST wait for the db_query tool result before calling observable_plot (in WORKFLOW A)
- In WORKFLOW B, you already have the result from the message history - use it directly
- NEVER pass the db_query tool call arguments to observable_plot
- NEVER pass the entire db_query result object to observable_plot
- ALWAYS extract result.data and format it as an array of objects with x and y properties

IMPORTANT FOR DATABASE QUERIES AND CHARTS:
- Only write SELECT queries (read-only)
- Use proper PostgreSQL syntax
- Common tables include: people (with type field: 'person_in_need' or 'aid_worker'), people_needs, skills, parishes, communities, forms, form_submissions, assets, warehouses, users (with role field), etc.
- Always validate that your query will return meaningful data
- After getting query results from db_query tool, the result will have this structure: { type: "db_query_result", data: [...], rowCount: number, columns: [...], description: string }
- CRITICAL: When creating charts from query results, you MUST:
  1. Extract the data array from the query result: use result.data (NOT the entire result object)
  2. Format it properly for charts:
     - For bar/line charts: Convert to array of objects like [{x: "Category", y: count}, ...]
     - Example: If query returns [{type: "aid_worker", count: 10}, {type: "person_in_need", count: 5}], 
       format as [{x: "Aid Worker", y: 10}, {x: "Person in Need", y: 5}]
  3. Pass ONLY the formatted array to observable_plot tool's data parameter
- NEVER pass the entire db_query result object to observable_plot - only pass the formatted data array
- When using observable_plot tool, the data parameter must ALWAYS be an array (array of objects or array of arrays), never a single object or the query result wrapper

Be conversational, helpful, and always ready to assist with data analysis and report generation.`,
      tools: {
        db_query: dbQueryTool,
        observable_plot: observablePlotTool,
        table: tableTool,
        pdf_document: pdfDocumentTool,
      },
    });

    // Create a readable stream that includes tool calls and results
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use fullStream to get text, tool calls, and tool results
          for await (const part of result.fullStream) {
            if (part.type === "text-delta") {
              // Stream text content
              controller.enqueue(
                new TextEncoder().encode(`0:${(part as any).text}\n`)
              );
            } else if (part.type === "tool-call") {
              // Stream tool call
              const toolCallData: any = {
                toolCallId: part.toolCallId,
                toolName: part.toolName,
              };

              // Get args from the tool call
              if ("args" in part) {
                toolCallData.args = (part as any).args;
              } else if ("input" in part) {
                toolCallData.args = (part as any).input;
              }

              controller.enqueue(
                new TextEncoder().encode(`8:${JSON.stringify(toolCallData)}\n`)
              );
            } else if (part.type === "tool-result") {
              // Stream tool result
              const toolResultData: any = {
                toolCallId: part.toolCallId,
              };

              // Get result from the tool result
              if ("result" in part) {
                toolResultData.result = (part as any).result;
              } else if ("output" in part) {
                toolResultData.result = (part as any).output;
              }

              controller.enqueue(
                new TextEncoder().encode(
                  `a:${JSON.stringify(toolResultData)}\n`
                )
              );
            }
          }

          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
