const axios = require('axios');
const xml2js = require('xml2js');
const { buildIflowZipBase64, base64UrlToBase64 } = require("./iflowBuilder");

function logDebug(message) {
  process.stdout.write(`[DEBUG] ${message}\n`);
}

function getCPIUrl(path) {
  let base = process.env.CPI_BASE_URL || "";
  base = base.replace(/\/$/, "");
  return `${base}${path}`;
}
async function getToken() {
  logDebug("🔑 Starting OAuth Token Handshake...");
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug("⚠️ [WARNING] OAuth environment variables are not configured in runtime .env. Fallback to mock authorization mode.");
    return "mock-oauth-token-integrovax-runtime";
  }
  const res = await axios.post(
    process.env.TOKEN_URL,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      auth: {
        username: process.env.CLIENT_ID,
        password: process.env.CLIENT_SECRET
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      }
    }
  );
  logDebug("✅ Token Generated Successfully.");
  return res.data.access_token;
}

async function testConnection() {
  const token = await getToken();
  const baseUrl = (process.env.CPI_BASE_URL || "").replace(/\/$/, "");
  return {
    ok: true,
    cpiBaseUrl: baseUrl || null,
    tokenPresent: Boolean(token),
  };
}
async function fetchMessageProcessingLogs() {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug("📋 Returning Mock Runtime Message Processing Logs.");
    return [
      {
        messageGuid: "MSG-9A2F8B10-C3E4-4D2A-B901-523F16E8",
        correlationId: "CORR-8f192b1a-554281",
        flowName: "Payment_Integration_Flow",
        status: "COMPLETED",
        logStart: new Date(Date.now() - 3600000).toISOString(),
        logEnd: new Date(Date.now() - 3597000).toISOString(),
        errorText: ""
      },
      {
        messageGuid: "MSG-7115342B-DDB4-4A1B-9B35-B4B53AA3",
        correlationId: "CORR-7f289c2b-449102",
        flowName: "Salesforce_Employee_Sync",
        status: "FAILED",
        logStart: new Date(Date.now() - 7200000).toISOString(),
        logEnd: new Date(Date.now() - 7185000).toISOString(),
        errorText: "HTTP connection timed out after 30000ms. Remote service endpoint is unreachable."
      }
    ];
  }

  const token = await getToken();
  const url = getCPIUrl("/api/v1/MessageProcessingLogs?$top=200&$orderby=LogStart desc");
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/atom+xml" }
  });
  const parser = new xml2js.Parser({ explicitArray: false });
  const parsed = await parser.parseStringPromise(response.data);
  let entries = parsed?.feed?.entry || [];
  if (!Array.isArray(entries)) entries = [entries];
  return entries.map(e => {
    const p = e?.content?.["m:properties"] || {};
    const errorText =
      p["d:ErrorInformation"] ||
      p["d:ErrorMessage"] ||
      p["d:CustomStatus"] ||
      "";
    return {
      messageGuid: p["d:MessageGuid"],
      correlationId: p["d:CorrelationId"],
      status: p["d:Status"],
      statusText: p["d:CustomStatus"] || "",
      flowName: p["d:IntegrationFlowName"],
      logStart: p["d:LogStart"],
      logEnd: p["d:LogEnd"],
      errorText: typeof errorText === "string" ? errorText : String(errorText || "")
    };
  });
}

async function fetchIntegrationPackages() {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug("📦 Returning Mock Runtime Integration Packages.");
    return [
      { Id: "Integrovax_Core_Package", Name: "IntegrovaX Core Integration Package", ShortText: "Standard mapping profiles and orchestration services" },
      { Id: "SuccessFactors_Employee_Sync", Name: "SuccessFactors Employee Synchronization Package", ShortText: "Design time artifacts for HR data consolidation" }
    ];
  }

  logDebug("📦 Requesting Master Integration Packages...");
  const token = await getToken();
  const url = getCPIUrl("/api/v1/IntegrationPackages?$format=json");
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
  });
  const results = response.data?.d?.results || response.data?.value || [];
  logDebug(`📊 Total Packages Discovered: ${results.length}`);
  return results;
}

async function fetchAllDesigntimeArtifacts() {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    return [
      { packageId: "Integrovax_Core_Package", iflowId: "Payment_Integration_Flow", iflowName: "Payment Integration Flow", version: "1.0.4" },
      { packageId: "SuccessFactors_Employee_Sync", iflowId: "Salesforce_Employee_Sync", iflowName: "Salesforce Employee Sync", version: "2.1.0" }
    ];
  }

  try {
    const token = await getToken();
    const url = getCPIUrl("/api/v1/IntegrationRuntimeArtifacts?$format=json");
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
    });
    const artifacts = response.data?.d?.results || response.data?.value || [];
    return artifacts
      .filter(a => (a.Type || a.ArtifactType || "").toLowerCase().includes("flow"))
      .map(a => ({
        packageId: a.PackageId || "DEPLOYED_ARTIFACT",
        iflowId: a.Id,
        iflowName: a.Name,
        version: a.Version
      }));
  } catch (err) {
    console.error("❌ Global Artifact Extraction Failed:", err.message);
    throw err;
  }
}

async function fetchPackagesWithNestedIflows() {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    return [
      {
        packageId: "Integrovax_Core_Package",
        packageName: "IntegrovaX Core Integration Package",
        iflows: [{ iflowId: "Payment_Integration_Flow", iflowName: "Payment Integration Flow", version: "1.0.4" }]
      },
      {
        packageId: "SuccessFactors_Employee_Sync",
        packageName: "SuccessFactors Employee Synchronization Package",
        iflows: [{ iflowId: "Salesforce_Employee_Sync", iflowName: "Salesforce Employee Sync", version: "2.1.0" }]
      }
    ];
  }

  logDebug("\n🚀🚀🚀 FETCH PACKAGES WITH NESTED IFLOWS TRIGGERED 🚀🚀🚀");
  try {
    const token = await getToken();
    const packages = await fetchIntegrationPackages();
    
    logDebug("⚡ Commencing Asynchronous Design-time Loop Pipeline...");
    
    const designTimeQueue = packages.map(async (pkg, index) => {
      const pkgId = pkg.Id;
      logDebug(`\n🔄 [INDEX ${index}] Querying Package Technical ID: "${pkgId}"`);
      
      const safePkgId = encodeURIComponent(pkgId);
      const url = getCPIUrl(`/api/v1/IntegrationPackages('${safePkgId}')/IntegrationDesigntimeArtifacts?$format=json`);
      
      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
        });
        
        let artifacts = response.data?.d?.results || response.data?.value || response.data || [];
        const artifactsArray = Array.isArray(artifacts) ? artifacts : [artifacts];

        const mappedIflows = artifactsArray
          .filter(artifact => {
            const typeValue = artifact.ArtifactType || artifact.Type || "";
            const artifactId = artifact.Id || "";
            const isValueMapping = artifactId.toLowerCase().includes("valuemapping") || typeValue.toLowerCase().includes("valuemapping");
            const isMatch = !isValueMapping; 
            
            logDebug(`     ▪ Artifact: "${artifactId}" | Safe Match Status: ${isMatch}`);
            return isMatch;
          })
          .map(artifact => ({
            iflowId: artifact.Id,
            iflowName: artifact.Name || artifact.Id,
            version: artifact.Version
          }));
          
        logDebug(`✅ Finished package [${pkgId}]. Filtered iFlow Count: ${mappedIflows.length}`);
        return { packageId: pkgId, packageName: pkg.Name, iflows: mappedIflows };
        
      } catch (loopErr) {
        logDebug(`❌ NETWORK ERROR ON PACKAGE [${pkgId}] -> ${loopErr.message}`);
        return { packageId: pkgId, packageName: pkg.Name, iflows: [] };
      }
    });
    
    const finalResult = await Promise.all(designTimeQueue);
    logDebug("\n🏁🏁🏁 ALL PIPELINE LOOPS COMPLETE 🏁🏁🏁\n");
    return finalResult;

  } catch (globalErr) {
    logDebug(`💥 CRITICAL GLOBAL EXCEPTION: ${globalErr.message}`);
    throw globalErr;
  }
}

async function getCsrfToken({ token }) {
  // Some CPI tenants require CSRF token for OData POST/PUT even with OAuth.
  try {
    const url = getCPIUrl("/api/v1/");
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-csrf-token": "Fetch",
        Accept: "application/json",
      },
    });
    const csrf = res.headers["x-csrf-token"] || res.headers["X-CSRF-Token"];
    const cookies = res.headers["set-cookie"] || [];
    return { csrfToken: csrf || null, cookies: Array.isArray(cookies) ? cookies : [cookies].filter(Boolean) };
  } catch {
    return { csrfToken: null, cookies: [] };
  }
}

async function createIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64 }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug(`[MOCK] Created designtime artifact: "${iflowId}" in package "${packageId}"`);
    return { Id: iflowId, Name: iflowName, PackageId: packageId };
  }
  const token = await getToken();
  const { csrfToken, cookies } = await getCsrfToken({ token });

  const url = getCPIUrl("/api/v1/IntegrationDesigntimeArtifacts");
  const payload = {
    Id: iflowId,
    Name: iflowName || iflowId,
    PackageId: packageId,
    ArtifactContent: base64UrlToBase64(String(artifactContentBase64)),
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, payload, { headers });
  return res.data;
}

async function updateIntegrationDesigntimeArtifact({ iflowId, packageId, artifactContentBase64 }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug(`[MOCK] Updated designtime artifact: "${iflowId}" in package "${packageId}"`);
    return { Id: iflowId, PackageId: packageId };
  }
  const token = await getToken();
  const { csrfToken, cookies } = await getCsrfToken({ token });

  const url = getCPIUrl(`/api/v1/IntegrationDesigntimeArtifacts(Id='${encodeURIComponent(iflowId)}',Version='Active')/$value`);
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/octet-stream",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const binaryData = Buffer.from(artifactContentBase64, "base64");
  const res = await axios.put(url, binaryData, { headers });
  return res.data;
}

async function deployIntegrationDesigntimeArtifact({ iflowId }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug(`[MOCK] Deployed designtime artifact: "${iflowId}"`);
    return { Id: iflowId, Status: "Deployed" };
  }
  const token = await getToken();
  const { csrfToken, cookies } = await getCsrfToken({ token });

  const url = getCPIUrl(`/api/v1/DeployIntegrationDesigntimeArtifact?Id='${encodeURIComponent(iflowId)}'&Version='Active'`);
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, {}, { headers });
  return res.data;
}

async function checkDesigntimeArtifactExists({ iflowId, packageId }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    return true;
  }
  try {
    const token = await getToken();
    let url;
    if (packageId) {
      url = getCPIUrl(`/api/v1/IntegrationPackages('${encodeURIComponent(packageId)}')/IntegrationDesigntimeArtifacts?$format=json`);
    } else {
      url = getCPIUrl(`/api/v1/IntegrationDesigntimeArtifacts?$format=json`);
    }
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const res = await axios.get(url, { headers });
    const results = res.data?.d?.results || res.data?.value || [];
    return results.some(a => a.Id === iflowId);
  } catch (err) {
    return false;
  }
}

async function upsertIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64 }) {
  const exists = await checkDesigntimeArtifactExists({ iflowId, packageId });
  if (exists) {
    logDebug(`🔄 Designtime artifact [${iflowId}] exists in package [${packageId}]. Executing OData PUT update...`);
    await updateIntegrationDesigntimeArtifact({ iflowId, packageId, artifactContentBase64 });
    return { upsertAction: "UPDATE", ok: true };
  } else {
    logDebug(`🆕 Designtime artifact [${iflowId}] does not exist in package [${packageId}]. Executing OData POST creation...`);
    const data = await createIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64 });
    return { upsertAction: "CREATE", ok: true, data };
  }
}

async function checkPackageExists({ packageId }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    return true;
  }
  try {
    const token = await getToken();
    const safeId = encodeURIComponent(packageId);
    const url = getCPIUrl(`/api/v1/IntegrationPackages('${safeId}')?$format=json`);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    const res = await axios.get(url, { headers });
    return Boolean(res.data?.d?.Id || res.data?.Id);
  } catch (err) {
    return false;
  }
}

async function createIntegrationPackage({ packageId, packageName, packageDescription }) {
  if (!process.env.TOKEN_URL || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    logDebug(`[MOCK] Created integration package: "${packageId}"`);
    return { Id: packageId, Name: packageName };
  }
  const token = await getToken();
  const { csrfToken, cookies } = await getCsrfToken({ token });

  const url = getCPIUrl("/api/v1/IntegrationPackages");
  const payload = {
    Id: packageId,
    Name: packageName || packageId,
    ShortText: packageDescription || "Created dynamically via iFlow Builder",
    Version: "1.0.0"
  };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, payload, { headers });
  return res.data;
}

async function upsertIntegrationPackage({ packageId, packageName, packageDescription }) {
  const exists = await checkPackageExists({ packageId });
  if (exists) {
    logDebug(`🔄 Integration package [${packageId}] already exists. Reusing it.`);
    return { upsertAction: "REUSE", ok: true };
  } else {
    logDebug(`🆕 Integration package [${packageId}] does not exist. Creating via OData POST...`);
    const data = await createIntegrationPackage({ packageId, packageName, packageDescription });
    return { upsertAction: "CREATE", ok: true, data };
  }
}

async function generateIflowArtifact({ iflowId, iflowName, iflwXml, scripts, mappings }) {
  return await buildIflowZipBase64({ iflowId, iflowName, iflwXml, scripts, mappings });
}

module.exports = {
  fetchMessageProcessingLogs,
  fetchIntegrationPackages,
  fetchAllDesigntimeArtifacts,
  fetchPackagesWithNestedIflows,
  testConnection,
  generateIflowArtifact,
  createIntegrationDesigntimeArtifact,
  updateIntegrationDesigntimeArtifact,
  deployIntegrationDesigntimeArtifact,
  checkDesigntimeArtifactExists,
  upsertIntegrationDesigntimeArtifact,
  checkPackageExists,
  createIntegrationPackage,
  upsertIntegrationPackage,
};