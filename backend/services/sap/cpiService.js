const axios = require('axios');
const xml2js = require('xml2js');
const { buildIflowZipBase64, base64UrlToBase64 } = require("./iflowBuilder");

function logDebug(message) {
  process.stdout.write(`[DEBUG] ${message}\n`);
}

// Dynamically construct config using incoming context and backend .env fallback
function getActiveConfig(envContext) {
  let baseUrl = envContext?.baseUrl || process.env.CPI_BASE_URL || "";
  baseUrl = baseUrl.replace(/\/$/, "");
  
  // Strip trailing /api/v1 from baseUrl if present to prevent double paths
  baseUrl = baseUrl.replace(/\/api\/v1$/, "");
  baseUrl = baseUrl.replace(/\/$/, "");
  
  // Prevent loopbacks if headers mistakenly point to backend port 40005
  if (!baseUrl || baseUrl.includes("localhost:40005") || envContext?.envName === "RUNTIME") {
    baseUrl = (process.env.CPI_BASE_URL || "").replace(/\/$/, "");
    baseUrl = baseUrl.replace(/\/api\/v1$/, "");
    baseUrl = baseUrl.replace(/\/$/, "");
  }

  let authType = envContext?.authType || (process.env.TOKEN_URL ? "oauth" : "none");
  if (authType === "oauth2") {
    authType = "oauth";
  }
  
  return {
    envName: envContext?.envName || "RUNTIME",
    baseUrl,
    authType,
    username: envContext?.username || "",
    password: envContext?.password || "",
    clientId: envContext?.clientId || process.env.CLIENT_ID || "",
    clientSecret: envContext?.clientSecret || process.env.CLIENT_SECRET || "",
    tokenUrl: envContext?.tokenUrl || process.env.TOKEN_URL || "",
    apiKeyName: envContext?.apiKeyName || "apiKey",
    apiKeyValue: envContext?.apiKeyValue || "",
    apiKeyLocation: envContext?.apiKeyLocation || "header"
  };
}

// Resilient fallback check to run in Mock Mode if no valid credentials exist
function shouldMock(config) {
  if (config.authType === "none") {
    if (!process.env.TOKEN_URL && !process.env.CLIENT_ID && !process.env.CLIENT_SECRET) {
      return true;
    }
  }
  if (config.authType === "oauth") {
    if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
      return true;
    }
  }
  if (config.authType === "basic") {
    if (!config.username || !config.password) {
      return true;
    }
  }
  if (config.authType === "apikey") {
    if (!config.apiKeyValue) {
      return true;
    }
  }
  if (!config.baseUrl) {
    return true;
  }
  return false;
}

// Construct final target URL with optional query api key appending
function getCPIUrl(path, config) {
  const base = config.baseUrl.replace(/\/$/, "");
  let url = `${base}${path}`;
  if (config.authType === "apikey" && config.apiKeyLocation === "query") {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}${config.apiKeyName}=${encodeURIComponent(config.apiKeyValue)}`;
  }
  return url;
}

// Dynamic OAuth handshake
async function getToken(config) {
  logDebug("🔑 Starting OAuth Token Handshake...");
  if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
    logDebug("⚠️ [WARNING] OAuth environment credentials are not configured. Fallback to mock authorization token.");
    return "mock-oauth-token-integrovax-runtime";
  }
  try {
    const res = await axios.post(
      config.tokenUrl,
      new URLSearchParams({ grant_type: "client_credentials" }),
      {
        auth: {
          username: config.clientId,
          password: config.clientSecret
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        }
      }
    );
    logDebug("✅ Token Generated Successfully.");
    return res.data.access_token;
  } catch (err) {
    console.error("❌ OAuth Token Handshake Failed:", err.message);
    if (err.response) {
      console.error("   Response status:", err.response.status);
      console.error("   Response data:", JSON.stringify(err.response.data));
    }
    throw err;
  }
}

// Get appropriate headers based on authentication type
async function getAuthHeaders(config) {
  const headers = {
    Accept: "application/json"
  };
  
  if (config.authType === "oauth") {
    const token = await getToken(config);
    headers["Authorization"] = `Bearer ${token}`;
  } else if (config.authType === "basic") {
    const creds = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    headers["Authorization"] = `Basic ${creds}`;
  } else if (config.authType === "apikey" && config.apiKeyLocation === "header") {
    headers[config.apiKeyName] = config.apiKeyValue;
  }
  
  return headers;
}

// Rich mock data helpers for offline and fallback modes
function getMockLogs(envName, warningText = "") {
  return [
    {
      messageGuid: "MSG-9A2F8B10-C3E4-4D2A-B901-523F16E8",
      correlationId: "CORR-8f192b1a-554281",
      flowName: "Payment_Integration_Flow",
      status: "COMPLETED",
      logStart: new Date(Date.now() - 3600000).toISOString(),
      logEnd: new Date(Date.now() - 3597000).toISOString(),
      errorText: warningText ? `[API Fallback] Connection offline. Detail: ${warningText}` : ""
    },
    {
      messageGuid: "MSG-7115342B-DDB4-4A1B-9B35-B4B53AA3",
      correlationId: "CORR-7f289c2b-449102",
      flowName: "Salesforce_Employee_Sync",
      status: "FAILED",
      logStart: new Date(Date.now() - 7200000).toISOString(),
      logEnd: new Date(Date.now() - 7185000).toISOString(),
      errorText: warningText 
        ? `Connection failed: ${warningText}`
        : `HTTP connection timed out after 30000ms. Remote service endpoint is unreachable on environment: ${envName}.`
    }
  ];
}

function getMockPackages(envName) {
  return [
    { Id: "Integrovax_Core_Package", Name: "IntegrovaX Core Integration Package", ShortText: `Standard mapping profiles and orchestration services on ${envName}` },
    { Id: "SuccessFactors_Employee_Sync", Name: "SuccessFactors Employee Synchronization Package", ShortText: `Design time artifacts for HR data consolidation on ${envName}` }
  ];
}

function getMockArtifacts() {
  return [
    { packageId: "Integrovax_Core_Package", iflowId: "Payment_Integration_Flow", iflowName: "Payment Integration Flow", version: "1.0.4" },
    { packageId: "SuccessFactors_Employee_Sync", iflowId: "Salesforce_Employee_Sync", iflowName: "Salesforce Employee Sync", version: "2.1.0" }
  ];
}

function getMockPackagesWithNestedIflows() {
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

async function testConnection(envContext) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return {
      ok: true,
      cpiBaseUrl: config.baseUrl || null,
      tokenPresent: false,
      isMock: true
    };
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    const url = getCPIUrl("/api/v1/", config);
    await axios.get(url, { headers: authHeaders });
    return {
      ok: true,
      cpiBaseUrl: config.baseUrl,
      tokenPresent: true,
      isMock: false
    };
  } catch (err) {
    throw new Error(`Connection verification failed: ${err.message}`);
  }
}

async function fetchMessageProcessingLogs(envContext) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return getMockLogs(config.envName);
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    const url = getCPIUrl("/api/v1/MessageProcessingLogs?$top=200&$orderby=LogStart desc", config);
    const response = await axios.get(url, {
      headers: { ...authHeaders, Accept: "application/atom+xml" }
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
  } catch (err) {
    logDebug(`⚠️ fetchMessageProcessingLogs failed: ${err.message}. Falling back to mock data.`);
    return getMockLogs(config.envName, err.message);
  }
}

async function fetchIntegrationPackages(envContext) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return getMockPackages(config.envName);
  }
  try {
    logDebug("📦 Requesting Master Integration Packages...");
    const authHeaders = await getAuthHeaders(config);
    const url = getCPIUrl("/api/v1/IntegrationPackages?$format=json", config);
    const response = await axios.get(url, {
      headers: { ...authHeaders, Accept: "application/json" }
    });
    const results = response.data?.d?.results || response.data?.value || [];
    logDebug(`📊 Total Packages Discovered: ${results.length}`);
    return results;
  } catch (err) {
    logDebug(`⚠️ fetchIntegrationPackages failed: ${err.message}. Falling back to mock data.`);
    return getMockPackages(config.envName);
  }
}

async function fetchAllDesigntimeArtifacts(envContext) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return getMockArtifacts();
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    const url = getCPIUrl("/api/v1/IntegrationRuntimeArtifacts?$format=json", config);
    const response = await axios.get(url, {
      headers: { ...authHeaders, Accept: "application/json" }
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
    logDebug(`⚠️ fetchAllDesigntimeArtifacts failed: ${err.message}. Falling back to mock data.`);
    return getMockArtifacts();
  }
}

async function fetchPackagesWithNestedIflows(envContext) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return getMockPackagesWithNestedIflows();
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    const packages = await fetchIntegrationPackages(envContext);
    
    logDebug("⚡ Commencing Asynchronous Design-time Loop Pipeline...");
    
    const designTimeQueue = packages.map(async (pkg, index) => {
      const pkgId = pkg.Id;
      logDebug(`\n🔄 [INDEX ${index}] Querying Package Technical ID: "${pkgId}"`);
      
      const safePkgId = encodeURIComponent(pkgId);
      const url = getCPIUrl(`/api/v1/IntegrationPackages('${safePkgId}')/IntegrationDesigntimeArtifacts?$format=json`, config);
      
      try {
        const response = await axios.get(url, {
          headers: { ...authHeaders, Accept: "application/json" }
        });
        
        let artifacts = response.data?.d?.results || response.data?.value || response.data || [];
        const artifactsArray = Array.isArray(artifacts) ? artifacts : [artifacts];

        const mappedIflows = artifactsArray
          .filter(artifact => {
            const typeValue = artifact.ArtifactType || artifact.Type || "";
            const artifactId = artifact.Id || "";
            const isValueMapping = artifactId.toLowerCase().includes("valuemapping") || typeValue.toLowerCase().includes("valuemapping");
            const isMatch = !isValueMapping; 
            return isMatch;
          })
          .map(artifact => ({
            iflowId: artifact.Id,
            iflowName: artifact.Name || artifact.Id,
            version: artifact.Version
          }));
        
        return { packageId: pkgId, packageName: pkg.Name, iflows: mappedIflows };
      } catch (loopErr) {
        logDebug(`❌ NETWORK ERROR ON PACKAGE [${pkgId}] -> ${loopErr.message}`);
        return { packageId: pkgId, packageName: pkg.Name, iflows: [] };
      }
    });
    
    return await Promise.all(designTimeQueue);
  } catch (err) {
    logDebug(`⚠️ fetchPackagesWithNestedIflows failed: ${err.message}. Falling back to mock data.`);
    return getMockPackagesWithNestedIflows();
  }
}

async function getCsrfToken({ config }) {
  try {
    const url = getCPIUrl("/api/v1/", config);
    const authHeaders = await getAuthHeaders(config);
    const res = await axios.get(url, {
      headers: {
        ...authHeaders,
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

async function createIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    logDebug(`[MOCK] Created designtime artifact: "${iflowId}" in package "${packageId}"`);
    return { Id: iflowId, Name: iflowName, PackageId: packageId };
  }
  
  const authHeaders = await getAuthHeaders(config);
  const { csrfToken, cookies } = await getCsrfToken({ config });

  const url = getCPIUrl("/api/v1/IntegrationDesigntimeArtifacts", config);
  const payload = {
    Id: iflowId,
    Name: iflowName || iflowId,
    PackageId: packageId,
    ArtifactContent: base64UrlToBase64(String(artifactContentBase64)),
  };

  const headers = {
    ...authHeaders,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, payload, { headers });
  return res.data;
}

async function updateIntegrationDesigntimeArtifact({ iflowId, packageId, artifactContentBase64, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    logDebug(`[MOCK] Updated designtime artifact: "${iflowId}" in package "${packageId}"`);
    return { Id: iflowId, PackageId: packageId };
  }
  
  const authHeaders = await getAuthHeaders(config);
  const { csrfToken, cookies } = await getCsrfToken({ config });

  const url = getCPIUrl(`/api/v1/IntegrationDesigntimeArtifacts(Id='${encodeURIComponent(iflowId)}',Version='Active')/$value`, config);
  const headers = {
    ...authHeaders,
    "Content-Type": "application/octet-stream",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const binaryData = Buffer.from(artifactContentBase64, "base64");
  const res = await axios.put(url, binaryData, { headers });
  return res.data;
}

async function deployIntegrationDesigntimeArtifact({ iflowId, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    logDebug(`[MOCK] Deployed designtime artifact: "${iflowId}"`);
    return { Id: iflowId, Status: "Deployed" };
  }
  
  const authHeaders = await getAuthHeaders(config);
  const { csrfToken, cookies } = await getCsrfToken({ config });

  const url = getCPIUrl(`/api/v1/DeployIntegrationDesigntimeArtifact?Id='${encodeURIComponent(iflowId)}'&Version='Active'`, config);
  const headers = {
    ...authHeaders,
    Accept: "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, {}, { headers });
  return res.data;
}

async function checkDesigntimeArtifactExists({ iflowId, packageId, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return true;
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    let url;
    if (packageId) {
      url = getCPIUrl(`/api/v1/IntegrationPackages('${encodeURIComponent(packageId)}')/IntegrationDesigntimeArtifacts?$format=json`, config);
    } else {
      url = getCPIUrl(`/api/v1/IntegrationDesigntimeArtifacts?$format=json`, config);
    }
    const headers = {
      ...authHeaders,
      Accept: "application/json",
    };
    const res = await axios.get(url, { headers });
    const results = res.data?.d?.results || res.data?.value || [];
    return results.some(a => a.Id === iflowId);
  } catch (err) {
    return false;
  }
}

async function upsertIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64, envContext }) {
  const exists = await checkDesigntimeArtifactExists({ iflowId, packageId, envContext });
  if (exists) {
    logDebug(`🔄 Designtime artifact [${iflowId}] exists in package [${packageId}]. Executing OData PUT update...`);
    await updateIntegrationDesigntimeArtifact({ iflowId, packageId, artifactContentBase64, envContext });
    return { upsertAction: "UPDATE", ok: true };
  } else {
    logDebug(`🆕 Designtime artifact [${iflowId}] does not exist in package [${packageId}]. Executing OData POST creation...`);
    const data = await createIntegrationDesigntimeArtifact({ iflowId, iflowName, packageId, artifactContentBase64, envContext });
    return { upsertAction: "CREATE", ok: true, data };
  }
}

async function checkPackageExists({ packageId, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    return true;
  }
  try {
    const authHeaders = await getAuthHeaders(config);
    const safeId = encodeURIComponent(packageId);
    const url = getCPIUrl(`/api/v1/IntegrationPackages('${safeId}')?$format=json`, config);
    const headers = {
      ...authHeaders,
      Accept: "application/json",
    };
    const res = await axios.get(url, { headers });
    return Boolean(res.data?.d?.Id || res.data?.Id);
  } catch (err) {
    return false;
  }
}

async function createIntegrationPackage({ packageId, packageName, packageDescription, envContext }) {
  const config = getActiveConfig(envContext);
  if (shouldMock(config)) {
    logDebug(`[MOCK] Created integration package: "${packageId}"`);
    return { Id: packageId, Name: packageName };
  }
  
  const authHeaders = await getAuthHeaders(config);
  const { csrfToken, cookies } = await getCsrfToken({ config });

  const url = getCPIUrl("/api/v1/IntegrationPackages", config);
  const payload = {
    Id: packageId,
    Name: packageName || packageId,
    ShortText: packageDescription || "Created dynamically via iFlow Builder",
    Version: "1.0.0"
  };

  const headers = {
    ...authHeaders,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  if (cookies.length) headers.Cookie = cookies.map((c) => c.split(";")[0]).join("; ");

  const res = await axios.post(url, payload, { headers });
  return res.data;
}

async function upsertIntegrationPackage({ packageId, packageName, packageDescription, envContext }) {
  const exists = await checkPackageExists({ packageId, envContext });
  if (exists) {
    logDebug(`🔄 Integration package [${packageId}] already exists. Reusing it.`);
    return { upsertAction: "REUSE", ok: true };
  } else {
    logDebug(`🆕 Integration package [${packageId}] does not exist. Creating via OData POST...`);
    const data = await createIntegrationPackage({ packageId, packageName, packageDescription, envContext });
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