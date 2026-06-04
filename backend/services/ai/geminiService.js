const { toSafeId } = require("../sap/iflowBuilder");

function getGenAiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    // Lazy-require so backend can start even if dependency isn't installed yet
    // (we fall back to deterministic behavior).
    // eslint-disable-next-line global-require
    const { GoogleGenAI } = require("@google/genai");
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch {
    return null;
  }
}

/**
 * Dissects a single failed SAP CPI log entry to pinpoint root cause remediation steps.
 */
async function generateFailureAnalysis(logData) {
  const ai = getGenAiClient();
  if (!ai) {
    return [
      "**AI is not configured** (missing `GEMINI_API_KEY` and/or `@google/genai` dependency).",
      "",
      "**Fallback summary**:",
      `- **Flow**: ${logData.flowName || "-"}`,
      `- **GUID**: ${logData.messageGuid || "-"}`,
      `- **Time**: ${logData.logStart || "-"}`,
      `- **Error**: ${logData.errorText || "No error text"}`,
    ].join("\n");
  }
  const systemPrompt = `
    You are an expert SAP CPI (Cloud Platform Integration) enterprise architect and troubleshooting assistant.
    Analyze the provided runtime log trace payload and return a clear, structured Markdown summary explaining:
    1. The likely technical error vector (e.g., structural validation error, timeout, mapping mismatch, authentication failure).
    2. Concrete remediation steps (what the developer should check in their iFlow design, certificate keystores, or XSD schemas).
    Keep the tone professional, direct, and actionable. Avoid generic prose.
  `;

  const userContent = `
    Failed Integration Flow Name: ${logData.flowName}
    Message GUID: ${logData.messageGuid}
    Log Start Time: ${logData.logStart}
    Raw Error String Text: ${logData.errorText || "No explicit raw trace text recorded."}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${systemPrompt}\n\n---\n\n${userContent}`
  });

  return response.text;
}

/**
 * Handles conversational queries inside the floating Copilot widget using full system context.
 */
async function generateCopilotReply(userMessage, systemContext, latestFailure) {
  const ai = getGenAiClient();
  if (!ai) {
    const total = systemContext?.total || 0;
    const failed = systemContext?.failed || 0;
    return [
      "**AI is not configured** (missing `GEMINI_API_KEY` and/or `@google/genai`).",
      "",
      "**Current summary**:",
      `- Total: ${total}`,
      `- Failed: ${failed}`,
      latestFailure ? `- Latest failure flow: ${latestFailure.flowName || "-"}` : "- Latest failure: none",
    ].join("\n");
  }
  const systemPrompt = `
    You are 'Gemini Copilot', an AI assistant embedded directly inside 'CPI Lens', a local monitoring dashboard for SAP CPI.
    You have direct visibility into real-time transactional telemetry metrics.
    Use the provided real-time system profile state to answer questions accurately.
    If the user types 'analyze', perform a technical breakdown on the most recent pipeline failure.
    Format your responses with clear Markdown bullet points or bold metrics headers for readability.
  `;

  const contextPayload = `
    Real-time Dashboard Metrics:
    - Total Monitored Message Streams: ${systemContext?.total || 0}
    - Failed Message Count: ${systemContext?.failed || 0}
    
    Most Recent Active Pipeline Exception Context:
    ${latestFailure ? JSON.stringify(latestFailure, null, 2) : "No active failures detected in this batch cycle."}
    
    User Query: "${userMessage}"
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${systemPrompt}\n\n---\n\n${contextPayload}`
  });

  return response.text;
}

const extractIflowId = (message) => {
  const msg = (message || "").trim();
  if (!msg) return "Fetch_Northwind_Employees";

  // 1. Matches: "create empty iflow My_Flow" or "create flow My_Flow" or "create iflow My_Flow"
  let match = msg.match(/create\s+(?:empty\s+)?(?:iflow|flow)\s+([A-Za-z0-9_-]+)/i);
  if (match) return match[1];

  // 2. Matches: "create My_Flow" or "build My_Flow" or "deploy My_Flow" or "make My_Flow" or "generate My_Flow"
  match = msg.match(/(?:create|build|deploy|make|generate)\s+([A-Za-z0-9_-]+)/i);
  if (match) return match[1];

  // 3. Matches: "My_Flow in EVENTMesh" (starts with alphanumeric word)
  match = msg.match(/^([A-Za-z0-9_-]{3,})/);
  if (match) return match[1];

  // 4. Fallback search for any word containing underscores or camelCase indicating a technical name
  const words = msg.split(/\s+/);
  for (const w of words) {
    const clean = w.replace(/[^A-Za-z0-9_-]/g, "");
    if (clean.includes("_") || (clean.length > 4 && /[a-z]+[A-Z]/.test(clean))) {
      return clean;
    }
  }

  // 5. Hard fallback
  return "Fetch_Northwind_Employees";
};

/**
 * Produces a conservative iFlow build spec and a minimal deployable BPMN (.iflw) XML.
 * The ZIP generation is done locally (deflate-compressed ZIP + strict CPI folder layout).
 */
async function generateIflowSpec(userMessage, packageId, iflowName) {
  const targetPackage = (packageId && packageId.trim()) ? packageId.trim() : "EVENTMesh";
  
  let guessedName = (iflowName && iflowName.trim()) ? iflowName.trim() : "";
  if (!guessedName) {
    const guessedId = extractIflowId(userMessage);
    guessedName = guessedId.replace(/_/g, " ");
  }

  const id = toSafeId(guessedName);
  const name = guessedName;

  const fallbackSpec = {
    packageAction: "reuse",
    packageName: targetPackage,
    steps: [
      {
        tool: "create-empty-iflow",
        input: {
          packageId: targetPackage,
          iflowId: id,
          iflowName: name
        }
      },
      {
        tool: "update-iflow",
        input: {
          iflowId: id
        }
      },
      {
        tool: "deploy-iflow",
        input: {
          iflowId: id
        }
      }
    ]
  };

  const ai = getGenAiClient();
  if (!ai) {
    return fallbackSpec;
  }

  const systemPrompt = `
You are a Structured SAP Integration Suite Technical Planner.
You must translate the user's integration requirement into a clean step-by-step sequence of MCP tool invocations.

The target SAP package is "${targetPackage}". You MUST use "${targetPackage}" as the "packageName" and "packageId" in the steps. Do NOT invent other package IDs.
The target iFlow ID is "${id}". You MUST use "${id}" as the "iflowId" in the steps. Do NOT invent other iFlow IDs.

You MUST produce ONLY a single, valid JSON object matching the schema below. 
Do NOT include markdown fences, code blocks (do not wrap in \`\`\`json), XML, BPMN, Groovy scripts, or any conversational explanations.

Schema:
{
  "packageAction": "create | reuse",
  "packageName": "${targetPackage}",
  "steps": [
    {
      "tool": "create-empty-iflow",
      "input": {
        "packageId": "${targetPackage}",
        "iflowId": "Unique, clean alphanumeric ID (e.g. Fetch_Northwind_Employees, letters/numbers/underscores only)",
        "iflowName": "Human friendly name of the Integration Flow"
      }
    },
    {
      "tool": "update-iflow",
      "input": {
        "iflowId": "Technical ID of the Integration Flow"
      }
    },
    {
      "tool": "deploy-iflow",
      "input": {
        "iflowId": "Technical ID of the Integration Flow"
      }
    }
  ]
}

Ensure all JSON string properties are properly escaped. Do not append any other keys or metadata.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\n---\n\nUser request:\n${String(userMessage || "")}`
    });

    const raw = String(response.text || "").trim();
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const maybeJson = raw.slice(firstBrace, lastBrace + 1);
        obj = JSON.parse(maybeJson);
      } else {
        obj = null;
      }
    }

    if (!obj || !Array.isArray(obj.steps)) {
      return fallbackSpec;
    }

    // Sanitize steps input structures to strictly match the user-provided chat board settings
    const sanitizedSteps = obj.steps.map(step => {
      const sInput = step.input || {};
      if (step.tool === "create-empty-iflow") {
        return {
          tool: "create-empty-iflow",
          input: {
            packageId: String(sInput.packageId || obj.packageName || targetPackage),
            iflowId: id, // Strict sync with user-specified Safe ID
            iflowName: name // Strict sync with user-specified Friendly Name
          }
        };
      }
      if (step.tool === "update-iflow") {
        return {
          tool: "update-iflow",
          input: {
            iflowId: id // Strict sync with user-specified Safe ID
          }
        };
      }
      if (step.tool === "deploy-iflow") {
        return {
          tool: "deploy-iflow",
          input: {
            iflowId: id // Strict sync with user-specified Safe ID
          }
        };
      }
      return step;
    });

    return {
      packageAction: String(obj.packageAction || "reuse"),
      packageName: String(obj.packageName || targetPackage),
      steps: sanitizedSteps
    };
  } catch (err) {
    console.error("AI Planning Error, falling back to standard trace plan:", err);
    return fallbackSpec;
  }
}

/**
 * Dynamically generates Groovy scripts and XSLT mapping assets based on the user's custom integration requirements prompt.
 */
async function generateIflowResources(userMessage) {
  const ai = getGenAiClient();
  if (!ai) {
    return { scripts: [], mappings: [] };
  }

  const systemPrompt = `
You are an expert SAP Cloud Integration (CPI) developer and AI code generator.
Based on the user's requirement, you must generate any necessary Groovy scripts or XSLT mappings to implement the integration logic.

You MUST produce ONLY a single, valid JSON object matching the schema below.
Do NOT include markdown fences, code blocks (do not wrap in \`\`\`json), or any conversational explanations.

Schema:
{
  "scripts": [
    {
      "fileName": "The filename of the Groovy script (e.g. convert.groovy)",
      "code": "The complete, production-ready, syntax-valid Groovy script code. It must include imports, def Message processData(Message message) function, null safety, and return the message."
    }
  ],
  "mappings": [
    {
      "fileName": "The filename of the XSLT mapping (e.g. map.xsl) if needed, or omit this array if not needed",
      "code": "The complete XSLT XML code"
    }
  ]
}

Ensure all JSON string properties (especially double quotes in the code) are properly escaped to prevent parsing errors.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${systemPrompt}\n\n---\n\nUser request:\n${String(userMessage || "")}`
    });

    const raw = String(response.text || "").trim();
    let obj;
    try {
      obj = JSON.parse(raw);
    } catch {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace >= 0 && lastBrace > firstBrace) {
        const maybeJson = raw.slice(firstBrace, lastBrace + 1);
        obj = JSON.parse(maybeJson);
      } else {
        obj = null;
      }
    }

    return {
      scripts: Array.isArray(obj?.scripts) ? obj.scripts : [],
      mappings: Array.isArray(obj?.mappings) ? obj.mappings : []
    };
  } catch (err) {
    console.error("AI Resource Generation Error:", err);
    return { scripts: [], mappings: [] };
  }
}

module.exports = {
  generateFailureAnalysis,
  generateCopilotReply,
  generateIflowSpec,
  generateIflowResources,
};