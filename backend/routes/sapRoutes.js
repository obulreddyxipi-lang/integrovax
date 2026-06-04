const express = require('express');
const router = express.Router();
const axios = require('axios');
const cpiService = require('../services/sap/cpiService');

// POST http://localhost:40005/sap/iflows/generate
// Body: { iflowId, iflowName }
router.post('/iflows/generate', async (req, res) => {
  try {
    const { iflowId, iflowName } = req.body || {};
    const data = await cpiService.generateIflowArtifact({ iflowId, iflowName });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST http://localhost:40005/sap/iflows/create
// Body: { iflowId, iflowName, packageId, artifactContentBase64 }
router.post('/iflows/create', async (req, res) => {
  try {
    // Support both our internal field names and the CPI/OData field names
    const body = req.body || {};
    const iflowId = body.iflowId || body.Id;
    const iflowName = body.iflowName || body.Name;
    const packageId = body.packageId || body.PackageId;
    const artifactContentBase64 = body.artifactContentBase64 || body.ArtifactContent;

    if (!iflowId) return res.status(400).json({ error: "Missing iflowId/Id" });
    if (!packageId) return res.status(400).json({ error: "Missing packageId/PackageId (required for artifact creation)" });
    if (!artifactContentBase64) return res.status(400).json({ error: "Missing artifactContentBase64/ArtifactContent" });
    const data = await cpiService.createIntegrationDesigntimeArtifact({
      iflowId,
      iflowName,
      packageId,
      artifactContentBase64,
    });
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// POST http://localhost:40005/sap/iflows/deploy
// Body: { iflowId, iflowName, packageId, artifactContentBase64 }
router.post('/iflows/deploy', async (req, res) => {
  try {
    const body = req.body || {};
    const iflowId = body.iflowId || body.Id;
    const iflowName = body.iflowName || body.Name;
    const packageId = body.packageId || body.PackageId;
    const artifactContentBase64 = body.artifactContentBase64 || body.ArtifactContent;

    if (!iflowId) return res.status(400).json({ error: "Missing iflowId/Id" });
    if (!packageId) return res.status(400).json({ error: "Missing packageId/PackageId (required for artifact creation)" });
    if (!artifactContentBase64) return res.status(400).json({ error: "Missing artifactContentBase64/ArtifactContent" });

    // Step 1: Resilient Upsert designtime
    const upsertRes = await cpiService.upsertIntegrationDesigntimeArtifact({
      iflowId,
      iflowName,
      packageId,
      artifactContentBase64,
    });

    // Step 2: Active Deploy
    const deployRes = await cpiService.deployIntegrationDesigntimeArtifact({ iflowId });

    res.json({
      ok: true,
      upsertAction: upsertRes.upsertAction,
      deployData: deployRes,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Handles: GET http://localhost:40005/sap/health
router.get('/health', async (req, res) => {
  try {
    const data = await cpiService.testConnection();
    res.json(data);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Handles: GET http://localhost:4000/sap/logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await cpiService.fetchMessageProcessingLogs();
    res.json({ count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handles: GET http://localhost:4000/sap/packages
router.get('/packages', async (req, res) => {
  try {
    const data = await cpiService.fetchIntegrationPackages();
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handles: GET http://localhost:4000/sap/iflows
router.get('/iflows', async (req, res) => {
  try {
    const data = await cpiService.fetchAllDesigntimeArtifacts();
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Handles: GET http://localhost:4000/sap/packages-with-iflows
router.get('/packages-with-iflows', async (req, res) => {
  try {
    const data = await cpiService.fetchPackagesWithNestedIflows();
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST http://localhost:40005/sap/sim/run-groovy
router.post('/sim/run-groovy', async (req, res) => {
  try {
    const payload = req.body || {};
    const response = await axios.post("https://groovyide.com/api/v1/run/cpi", payload, {
      headers: { "Content-Type": "application/json" }
    });
    res.json(response.data);
  } catch (err) {
    const status = err.response ? err.response.status : 500;
    const errorMsg = err.response && err.response.data ? err.response.data : err.message;
    res.status(status).json({ error: errorMsg });
  }
});

// POST http://localhost:40005/sap/sim/proxy
// Bypasses browser CORS restrictions by executing the API test server-side on Node
router.post('/sim/proxy', async (req, res) => {
  try {
    const { method, url, headers, data } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: "Missing target url" });
    }
    
    // Sanitize headers to prevent host/protocol discrepancies
    const cleanHeaders = { ...headers };
    delete cleanHeaders.host;
    delete cleanHeaders.connection;
    delete cleanHeaders.origin;
    delete cleanHeaders.referer;
    
    const config = {
      method: method || "GET",
      url: url,
      headers: cleanHeaders,
      data: data,
      timeout: 15000,
      validateStatus: () => true // Prevent axios from throwing on non-2xx status codes
    };
    
    const startTime = Date.now();
    const response = await axios(config);
    const duration = Date.now() - startTime;
    
    res.json({
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      duration: duration
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      statusText: "Proxy Execution Failed",
      error: err.message,
      data: err.response ? err.response.data : null
    });
  }
});

module.exports = router;