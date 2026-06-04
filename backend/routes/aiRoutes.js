const express = require("express");
const router = express.Router();
const { generateFailureAnalysis, generateCopilotReply, generateIflowSpec, generateIflowResources } = require("../services/ai/geminiService");
const cpiService = require("../services/sap/cpiService");

const getEnvContext = (req) => {
  return {
    envName: req.headers['x-cpi-env-name'],
    baseUrl: req.headers['x-cpi-base-url'],
    authType: req.headers['x-cpi-auth-type'],
    username: req.headers['x-cpi-username'],
    password: req.headers['x-cpi-password'],
    clientId: req.headers['x-cpi-client-id'],
    clientSecret: req.headers['x-cpi-client-secret'],
    tokenUrl: req.headers['x-cpi-token-url'],
    apiKeyName: req.headers['x-cpi-api-key-name'],
    apiKeyValue: req.headers['x-cpi-api-key-value'],
    apiKeyLocation: req.headers['x-cpi-api-key-location'],
  };
};

// Helper to derive a strictly compliant SAP CPI Technical ID from a friendly Package Name
function deriveTechnicalId(name) {
  if (!name) return "";
  // 1. Remove all spaces and underscores completely (Standard CPI package tool convention)
  let id = name.replace(/[\s_]+/g, "");
  // 2. Remove all other non-alphanumeric characters (strictly letters and numbers only)
  id = id.replace(/[^a-zA-Z0-9]/g, "");
  // 3. Ensure it starts with a letter (SAP CPI technical ID rule)
  if (id && !/^[a-zA-Z]/.test(id)) {
    id = "Pkg" + id;
  }
  return id || "DefaultPackage";
}

// ================= ROUTE: POST /ai/analyze-failure =================
router.post("/analyze-failure", async (req, res) => {
  try {
    const { log } = req.body;
    if (!log) {
      return res.status(400).json({ error: "Missing log object payload reference context." });
    }

    const analysisResult = await generateFailureAnalysis(log);
    return res.status(200).json({ analysis: analysisResult });
  } catch (error) {
    console.error("Gemini Failure Analysis Error:", error.message);
    return res.status(500).json({ 
      error: "Internal server processing exception.",
      details: error.message 
    });
  }
});

// ================= ROUTE: POST /ai/copilot-chat =================
router.post("/copilot-chat", async (req, res) => {
  try {
    const { message, context, latestFailure } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing user prompt string content." });
    }

    const aiReply = await generateCopilotReply(message, context, latestFailure);
    return res.status(200).json({ reply: aiReply });
  } catch (error) {
    console.error("Gemini Copilot Chat Error:", error.message);
    return res.status(500).json({ 
      error: "Internal server processing exception.",
      details: error.message 
    });
  }
});

// ================= ROUTE: POST /ai/create-iflow =================
// Body: { message }
// Returns: { spec, executionLogs, deploymentStatus, isSimulated }
router.post("/create-iflow", async (req, res) => {
  try {
    const { message, packageId, iflowName } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });

    // Derive a clean, valid technical ID from the package name passed by user
    const derivedPkgId = deriveTechnicalId(packageId || "EVENTMesh");

    // Step 1: LLM generates the tool execution plan using the derived technical ID
    const spec = await generateIflowSpec(message, derivedPkgId, iflowName);
    const executionLogs = [];
    let deploymentStatus = "PENDING";
    let isSimulated = false;

    executionLogs.push(`[PLANNING] Translating natural language intent into structured MCP tool calls...`);
    executionLogs.push(`[PLANNING] Discovered Package: "${spec.packageName}" (packageAction: "${spec.packageAction}")`);
    executionLogs.push(`[PLANNING] Planned steps: [${spec.steps.map(s => s.tool).join(", ")}]`);

    // Step 2: Dynamically generate Groovy scripts & mappings based on prompt message
    executionLogs.push(`[PLANNING] Analyzing prompt to dynamically generate Groovy scripts and mapping resources...`);
    const resources = await generateIflowResources(message);
    executionLogs.push(`[SUCCESS] AI generated ${resources.scripts.length} scripts and ${resources.mappings.length} mapping files dynamically.`);

    // We will attempt real execution of the steps sequentially
    try {
      // PROACTIVE SELF-HEALING PACKAGE CREATION
      if (spec.packageName) {
        const targetPkgId = deriveTechnicalId(spec.packageName);
        executionLogs.push(`[EXECUTION] Ensuring target package "${spec.packageName}" (Technical ID: "${targetPkgId}") exists...`);
        try {
          const pkgRes = await cpiService.upsertIntegrationPackage({
            packageId: targetPkgId,
            packageName: spec.packageName,
            packageDescription: `Dynamically created via Intent Planner AI Builder`,
            envContext: getEnvContext(req)
          });
          if (pkgRes.upsertAction === "CREATE") {
            executionLogs.push(`[SUCCESS] Package "${spec.packageName}" (ID: "${targetPkgId}") did not exist and was created dynamically via OData POST.`);
          } else {
            executionLogs.push(`[SUCCESS] Package "${spec.packageName}" (ID: "${targetPkgId}") verified on BTP tenant.`);
          }
          // Rewrite spec.packageName to use the technical ID for downstream integrations
          spec.packageName = targetPkgId;
        } catch (pkgErr) {
          executionLogs.push(`[WARNING] Package self-healing check returned: ${pkgErr.message}. Proceeding to create artifacts anyway.`);
        }
      }

      for (const step of spec.steps) {
        if (step.input && step.input.packageId) {
          step.input.packageId = deriveTechnicalId(step.input.packageId);
        }
        if (step.tool === "create-empty-iflow") {
          executionLogs.push(`[EXECUTION] Invoking MCP tool "create-empty-iflow" with input: ${JSON.stringify(step.input)}`);
          
          // Generate a valid compliant CPI ZIP template containing the dynamically generated scripts
          const zip = await cpiService.generateIflowArtifact({
            iflowId: step.input.iflowId,
            iflowName: step.input.iflowName,
            scripts: resources.scripts,
            mappings: resources.mappings
          });

          // Use upsert to resiliently create or update (avoiding duplicate ID crashes)
          let upsertRes;
          try {
            upsertRes = await cpiService.upsertIntegrationDesigntimeArtifact({
              iflowId: step.input.iflowId,
              iflowName: step.input.iflowName,
              packageId: step.input.packageId,
              artifactContentBase64: zip.artifactContentBase64,
              envContext: getEnvContext(req)
            });
          } catch (upsertErr) {
            const errStr = String(upsertErr.response?.data?.error?.message?.value || upsertErr.message);
            if (errStr.toLowerCase().includes("already exists")) {
              const uniqueSuffix = `_${Math.floor(Date.now() / 1000).toString().slice(-4)}`;
              const oldId = step.input.iflowId;
              step.input.iflowId = `${step.input.iflowId}${uniqueSuffix}`;
              step.input.iflowName = `${step.input.iflowName} ${uniqueSuffix}`;
              
              executionLogs.push(`[WARNING] Technical ID "${oldId}" already exists globally (e.g. Recycle Bin). Autocorrecting to: "${step.input.iflowId}"`);
              
              // Re-pack ZIP with the new ID
              const uniqueZip = await cpiService.generateIflowArtifact({
                iflowId: step.input.iflowId,
                iflowName: step.input.iflowName,
                scripts: resources.scripts,
                mappings: resources.mappings
              });
              
              upsertRes = await cpiService.upsertIntegrationDesigntimeArtifact({
                iflowId: step.input.iflowId,
                iflowName: step.input.iflowName,
                packageId: step.input.packageId,
                artifactContentBase64: uniqueZip.artifactContentBase64,
                envContext: getEnvContext(req)
              });
              
              // Update subsequent steps in the spec with the new unique ID
              spec.steps.forEach(s => {
                if (s.input && s.input.iflowId === oldId) {
                  s.input.iflowId = step.input.iflowId;
                }
              });
            } else {
              throw upsertErr;
            }
          }
          
          executionLogs.push(`[SUCCESS] Integration Flow designtime metadata synchronized (OData ${upsertRes.upsertAction}).`);
        } 
        else if (step.tool === "update-iflow") {
          executionLogs.push(`[EXECUTION] Invoking MCP tool "update-iflow" with input: ${JSON.stringify(step.input)}`);
          
          // Generate a valid compliant CPI ZIP template containing the dynamically generated scripts
          const zip = await cpiService.generateIflowArtifact({
            iflowId: step.input.iflowId,
            scripts: resources.scripts,
            mappings: resources.mappings
          });

          await cpiService.updateIntegrationDesigntimeArtifact({
            iflowId: step.input.iflowId,
            packageId: spec.packageName,
            artifactContentBase64: zip.artifactContentBase64,
            envContext: getEnvContext(req)
          });
          executionLogs.push(`[SUCCESS] Designtime iFlow content parameters updated with ${resources.scripts.length} Groovy scripts.`);
        } 
        else if (step.tool === "deploy-iflow") {
          executionLogs.push(`[EXECUTION] Invoking MCP tool "deploy-iflow" with input: ${JSON.stringify(step.input)}`);
          
          await cpiService.deployIntegrationDesigntimeArtifact({
            iflowId: step.input.iflowId,
            envContext: getEnvContext(req)
          });
          executionLogs.push(`[SUCCESS] Active deployment task successfully dispatched to runtime.`);
          deploymentStatus = "ACTIVE";
        }
      }
    } catch (realErr) {
      console.error("❌ CPI Real OData Execution Failed:", realErr.message, realErr.response?.data || "");
      executionLogs.push(`[ERROR] CPI OData Tool Call failed: ${realErr.message}`);
      if (realErr.response?.data) {
        const errDetails = typeof realErr.response.data === "object"
          ? JSON.stringify(realErr.response.data)
          : String(realErr.response.data);
        executionLogs.push(`[ERROR DETAILS] ${errDetails.slice(0, 300)}`);
      }

      // Enter Simulation Mode
      isSimulated = true;
      executionLogs.push(`[WARNING] Active connection trace failed. Activating resilient Simulation Mode...`);
      await new Promise(r => setTimeout(r, 400));

      if (spec.packageName) {
        const targetPkgId = deriveTechnicalId(spec.packageName);
        executionLogs.push(`[SIMULATED] Ensuring target integration package "${spec.packageName}" (Technical ID: "${targetPkgId}") exists...`);
        await new Promise(r => setTimeout(r, 300));
        executionLogs.push(`[SIMULATED SUCCESS] Integration package "${spec.packageName}" verified / dynamically created via OData POST.`);
        spec.packageName = targetPkgId;
      }

      for (const step of spec.steps) {
        if (step.input && step.input.packageId) {
          step.input.packageId = deriveTechnicalId(step.input.packageId);
        }
        if (step.tool === "create-empty-iflow") {
          executionLogs.push(`[SIMULATED] Invoking MCP tool "create-empty-iflow" with inputs: ${JSON.stringify(step.input)}`);
          await new Promise(r => setTimeout(r, 500));
          executionLogs.push(`[SIMULATED SUCCESS] Registered blank Integration Flow metadata in package "${step.input.packageId}".`);
        } 
        else if (step.tool === "update-iflow") {
          executionLogs.push(`[SIMULATED] Invoking MCP tool "update-iflow" with inputs: ${JSON.stringify(step.input)}`);
          await new Promise(r => setTimeout(r, 450));
          executionLogs.push(`[SIMULATED SUCCESS] Base ZIP archive uploaded with ${resources.scripts.length} dynamic Groovy scripts.`);
        } 
        else if (step.tool === "deploy-iflow") {
          executionLogs.push(`[SIMULATED] Invoking MCP tool "deploy-iflow" with inputs: ${JSON.stringify(step.input)}`);
          await new Promise(r => setTimeout(r, 600));
          executionLogs.push(`[SIMULATED SUCCESS] Deployment task successfully dispatched! iFlow deployed to mock BTP runtime.`);
          deploymentStatus = "ACTIVE";
        }
      }
    }

    return res.status(200).json({
      spec,
      executionLogs,
      deploymentStatus,
      isSimulated,
    });
  } catch (error) {
    console.error("Create iFlow Agent Error:", error.message);
    return res.status(500).json({ error: "Internal server processing exception.", details: error.message });
  }
});
// ================= ROUTE: POST /ai/create-package =================
// Body: { packageId, packageName, packageDescription }
router.post("/create-package", async (req, res) => {
  const { packageId, packageName, packageDescription } = req.body || {};
  try {
    if (!packageId) return res.status(400).json({ error: "Missing packageId" });

    // Derive a clean, valid technical ID from the input
    const derivedId = deriveTechnicalId(packageId);
    const displayName = packageName || packageId;

    const result = await cpiService.upsertIntegrationPackage({
      packageId: derivedId,
      packageName: displayName,
      packageDescription: packageDescription || `Created explicitly via iFlow Builder for "${displayName}"`,
      envContext: getEnvContext(req)
    });

    return res.status(200).json({
      success: true,
      upsertAction: result.upsertAction,
      packageId: derivedId,
      message: result.upsertAction === "CREATE"
        ? `Package "${displayName}" (ID: ${derivedId}) created successfully via OData.`
        : `Package "${displayName}" (ID: ${derivedId}) verified/reused.`
    });
  } catch (error) {
    console.error("Create Package Route Error:", error.message);
    const derivedId = deriveTechnicalId(packageId);
    const displayName = packageName || packageId;

    // Extract precise BTP / OData response details if available
    const errText = error.response?.data?.error?.message?.value
      || error.response?.data?.error?.message
      || error.message;

    // If BTP connection fails or trial is asleep, automatically run simulation fallback with explicit warning details
    return res.status(200).json({
      success: true,
      upsertAction: "SIMULATED",
      packageId: derivedId,
      errorDetails: errText,
      message: `⚠️ **BTP OData API request failed / returned error:** \`${errText}\`.\n\n*Gracefully entered virtual simulation trace: Package "${displayName}" (ID: ${derivedId}) successfully verified / created in simulator.*`
    });
  }
});

module.exports = router;