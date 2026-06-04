/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const AI_BASE_URL = process.env.REACT_APP_AI_BASE_URL || "http://localhost:40005/ai";

export default function IFlowBuilder({ activeEnvName = "RUNTIME" }) {
  const [prompt, setPrompt] = useState("Create an integration from S/4HANA to SuccessFactors Employee Central to sync employee master data. Trigger on employee creation or update and send data to SuccessFactors OData API.");
  const [packageId, setPackageId] = useState("EVENTMesh");
  const [customIflowName, setCustomIflowName] = useState("Fetch Northwind Employees");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("plan");
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  // Interactive integration details states
  const [integrationPattern, setIntegrationPattern] = useState("Request - Reply");
  const [scenarioType, setScenarioType] = useState("Data Integration");
  const [sourceSystem, setSourceSystem] = useState("S/4HANA");
  const [targetSystem, setTargetSystem] = useState("SuccessFactors");
  const [triggerConfig, setTriggerConfig] = useState("Real-time (Data Change)");
  const [dataFormat, setDataFormat] = useState("JSON");

  // Keep package creation handler
  const handleCreatePackage = async () => {
    if (!packageId.trim()) {
      alert("Please specify a valid Target Package ID.");
      return;
    }

    const targetPkg = packageId.trim();
    setStatus({ loading: true, error: "" });

    try {
      const res = await axios.post(`${AI_BASE_URL}/create-package`, {
        packageId: targetPkg,
        packageName: targetPkg,
        packageDescription: `Explicitly created package ${targetPkg} from CPI iFlow Builder`
      });

      const { upsertAction, packageId: returnedPackageId, message } = res.data;

      if (returnedPackageId) {
        setPackageId(returnedPackageId);
      }

      setTerminalLogs(prev => [
        ...prev,
        `[INFO] Explicit package creation initiated for ID: ${targetPkg}`,
        `[SUCCESS] Package Action: ${upsertAction} - ${message}`
      ]);
      
      alert(`Integration Package "${targetPkg}" synchronized successfully! Action: ${upsertAction}`);
      setStatus({ loading: false, error: "" });
    } catch (e) {
      const errorText = e?.response?.data?.details || e?.response?.data?.error || e.message;
      alert(`Package Creation Error: ${errorText}`);
      setStatus({ loading: false, error: errorText });
    }
  };

  // Keep OData CPI flow generation trigger
  const handleGenerateIFlow = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setStatus({ loading: true, error: "" });

    try {
      const res = await axios.post(`${AI_BASE_URL}/create-iflow`, { 
        message: prompt,
        packageId: packageId,
        iflowName: customIflowName
      });
      
      setResult(res.data);
      setTerminalLogs(res.data.executionLogs || []);
      
      alert("🎯 IntegrovaX AI Copilot compiled the OData CPI plan successfully! Plan review loaded.");
      setStatus({ loading: false, error: "" });
    } catch (e) {
      const errorText = e?.response?.data?.details || e?.response?.data?.error || e.message;
      alert(`AI Plan Compilation Error: ${errorText}`);
      setStatus({ loading: false, error: errorText });
    }
  };

  // Pre-fill prompt templates trigger
  const handleSelectTemplate = (templateName, promptText, pkg, flow) => {
    setPrompt(promptText);
    setPackageId(pkg);
    setCustomIflowName(flow);
  };

  return (
    <div style={styles.container}>
      
      {/* 🚀 STEP 1: WIZARD INDICATOR STEPS */}
      <section style={styles.stepperContainer}>
        
        {/* Step 1: Active Describe */}
        <div style={{ ...styles.stepCard, border: "1px solid var(--primary-blue)" }}>
          <div style={{ ...styles.stepNumberCircle, backgroundColor: "var(--primary-blue)", color: "#FFFFFF" }}>1</div>
          <div style={styles.stepTextContainer}>
            <span style={styles.stepTitle}>Describe</span>
            <span style={styles.stepDesc}>Define integration</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5" style={{ marginLeft: "auto", opacity: 0.8 }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Step 2: Design */}
        <div style={styles.stepCard}>
          <div style={styles.stepNumberCircle}>2</div>
          <div style={styles.stepTextContainer}>
            <span style={{ ...styles.stepTitle, color: "#64748B" }}>Design</span>
            <span style={styles.stepDesc}>AI creates flow</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Step 3: Configure */}
        <div style={styles.stepCard}>
          <div style={styles.stepNumberCircle}>3</div>
          <div style={styles.stepTextContainer}>
            <span style={{ ...styles.stepTitle, color: "#64748B" }}>Configure</span>
            <span style={styles.stepDesc}>Review & configure</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Step 4: Deploy */}
        <div style={styles.stepCard}>
          <div style={styles.stepNumberCircle}>4</div>
          <div style={styles.stepTextContainer}>
            <span style={{ ...styles.stepTitle, color: "#64748B" }}>Deploy</span>
            <span style={styles.stepDesc}>Deploy iFlow</span>
          </div>
        </div>

      </section>

      {/* ================= THREE-COLUMN WIZARD GRID ================= */}
      <div style={styles.wizardGrid}>
        
        {/* ----------------- COLUMN 1: DESCRIBE INTEGRATION (FORM) ----------------- */}
        <div style={styles.describeFormCard} className="glass-panel">
          <h3 style={styles.formSectionTitle}>Describe Your Integration</h3>
          <p style={styles.formSectionSub}>Provide details about the integration you want to build.</p>

          <form onSubmit={handleGenerateIFlow} style={styles.formBody}>
            
            {/* Natural Language Prompt Area */}
            <div style={styles.formField}>
              <span style={styles.fieldLabel}>Natural Language Description</span>
              <div style={styles.promptAreaWrapper}>
                
                {/* Glowing subtle gradient background */}
                <div style={styles.promptAreaGlow} />
                
                {/* AI Assistant Icon */}
                <div style={styles.aiAssistantIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2.5">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={styles.promptTextArea}
                  placeholder="Describe your standard CPI integration requirement..."
                />
                
                <span style={styles.characterCount}>{prompt.length}/1000</span>
                
                {/* Mini copy option inside prompt */}
                <button
                  type="button"
                  style={styles.promptCleanBtn}
                  onClick={() => setPrompt("")}
                  title="Clear Prompt"
                >
                  ✕
                </button>

              </div>
            </div>

            {/* Target Package Selection Input fields */}
            <div style={styles.inputsRow}>
              
              <div style={{ ...styles.formField, flex: 1 }}>
                <span style={styles.fieldLabel}>Target Package ID</span>
                <input
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  style={styles.roundedInput}
                  placeholder="e.g. EVENTMesh"
                />
              </div>

              <div style={{ ...styles.formField, flex: 1 }}>
                <span style={styles.fieldLabel}>Target iFlow Name</span>
                <input
                  type="text"
                  value={customIflowName}
                  onChange={(e) => setCustomIflowName(e.target.value)}
                  style={styles.roundedInput}
                  placeholder="e.g. Fetch Employees"
                />
              </div>

            </div>

            {/* Create Package & Configuration Options Actions */}
            <div style={styles.packageActionRow}>
              <button
                type="button"
                onClick={handleCreatePackage}
                style={styles.secondaryActionBtn}
                className="hover-scale"
              >
                ➕ Create Package
              </button>
            </div>

            {/* Dropdown selectors (Integration Pattern & Scenario Type) */}
            <div style={styles.dropdownsGrid}>
              
              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Integration Pattern</span>
                <select
                  value={integrationPattern}
                  onChange={(e) => setIntegrationPattern(e.target.value)}
                  style={styles.roundedSelect}
                >
                  <option>Request - Reply</option>
                  <option>Publish - Subscribe</option>
                  <option>Multicast</option>
                  <option>Point-to-Point</option>
                </select>
              </div>

              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Scenario Type</span>
                <select
                  value={scenarioType}
                  onChange={(e) => setScenarioType(e.target.value)}
                  style={styles.roundedSelect}
                >
                  <option>Data Integration</option>
                  <option>Process Integration</option>
                  <option>B2B Integration</option>
                </select>
              </div>

            </div>

            {/* Source & Target Systems Cards */}
            <div style={styles.systemsGrid}>
              
              {/* Source Card */}
              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Source System</span>
                <div style={styles.systemIconCard}>
                  <div style={{ ...styles.systemIconBadge, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#0A84FF" }}>SAP</span>
                  </div>
                  <div style={styles.systemDetails}>
                    <span style={styles.systemName}>S/4HANA</span>
                    <span style={styles.systemEnv}>On-Premise</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {/* Target Card */}
              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Target System</span>
                <div style={styles.systemIconCard}>
                  <div style={{ ...styles.systemIconBadge, backgroundColor: "rgba(111, 66, 255, 0.08)" }}>
                    <span style={{ fontSize: "11px", fontWeight: "800", color: "#6F42FF" }}>SAP</span>
                  </div>
                  <div style={styles.systemDetails}>
                    <span style={styles.systemName}>SuccessFactors</span>
                    <span style={styles.systemEnv}>Cloud</span>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" style={{ marginLeft: "auto" }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Trigger & Data Format Configurations */}
            <div style={styles.dropdownsGrid}>
              
              {/* Trigger */}
              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Trigger</span>
                <div style={styles.configDisplayCard}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5" style={{ marginRight: "10px" }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#1E293B" }}>Real-time (Data Change)</span>
                    <span style={{ fontSize: "9px", color: "#64748B", fontWeight: "600" }}>Triggered when data is created/updated</span>
                  </div>
                </div>
              </div>

              {/* Data Format */}
              <div style={styles.formField}>
                <span style={styles.fieldLabel}>Data Format</span>
                <div style={styles.configDisplayCard}>
                  <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--accent-purple)", marginRight: "10px", fontFamily: "monospace" }}>{`{ }`}</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#1E293B" }}>JSON</span>
                    <span style={{ fontSize: "9px", color: "#64748B", fontWeight: "600" }}>Javascript Object Notation</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Additional Details & Submit row */}
            <div style={styles.formFooterRow}>
              <button type="button" style={styles.addDetailsBtn}>+ Add Additional Details</button>
              
              <button
                type="submit"
                style={{
                  ...styles.submitGenerateBtn,
                  background: status.loading ? "rgba(10, 132, 255, 0.4)" : "var(--primary-blue)"
                }}
                disabled={status.loading}
                className="hover-scale"
              >
                {status.loading ? "Generating..." : "Generate iFlow Design >"}
              </button>
            </div>

          </form>
        </div>

        {/* ----------------- COLUMN 2: AI GENERATED DESIGN PREVIEW ----------------- */}
        <div style={styles.previewColumnCard} className="glass-panel">
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.formSectionTitle}>AI Generated iFlow Design (Preview)</h3>
            <span style={styles.draftBadge}>● Draft</span>
            
            <button type="button" style={styles.regenerateBtn} className="hover-scale">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5" style={{ marginRight: "4px" }}>
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>Regenerate</span>
            </button>
          </div>

          {/* 🌐 VISUAL NODE DIAGRAM WORKSPACE */}
          <div style={styles.diagramPanel}>
            
            {/* Node 1: S/4HANA (Source System - Blue) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #0A84FF", boxShadow: "0 0 12px rgba(10, 132, 255, 0.15)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0A84FF" }}>S/4HANA</span>
              <span style={styles.nodeSubLabel}>SAP On-Premise</span>
            </div>

            {/* Connection Arrow */}
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {/* Node 2: Receiver (Processing - Blue) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #0A84FF" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0A84FF" }}>Receiver</span>
              <span style={styles.nodeSubLabel}>Adapter</span>
            </div>

            {/* Connection Arrow */}
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {/* Node 3: Message Mapping (Processing - Purple) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #6F42FF", boxShadow: "0 0 12px rgba(111, 66, 255, 0.12)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#6F42FF" }}>Message</span>
              <span style={styles.nodeSubLabel}>Mapping</span>
            </div>

            {/* Connection Arrow */}
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {/* Node 4: Data Validation (Validation - Orange) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #FF8A00", boxShadow: "0 0 12px rgba(255, 138, 0, 0.12)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#FF8A00" }}>Data</span>
              <span style={styles.nodeSubLabel}>Validation</span>
            </div>

            {/* Connection Arrow */}
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {/* Node 5: OData (Processing - Blue) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #0A84FF" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#0A84FF" }}>OData</span>
              <span style={styles.nodeSubLabel}>Adapter</span>
            </div>

            {/* Connection Arrow */}
            <svg width="20" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>

            {/* Node 6: SuccessFactors (Success - Green) */}
            <div style={{ ...styles.diagramNode, border: "2px solid #22C55E", boxShadow: "0 0 12px rgba(34, 197, 94, 0.15)" }}>
              <span style={{ fontSize: "11px", fontWeight: "800", color: "#22C55E" }}>SuccessFactors</span>
              <span style={styles.nodeSubLabel}>SAP Cloud</span>
            </div>

          </div>

          {/* FLOW SUMMARY WIDGET */}
          <div style={styles.summaryWidget}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>5</span>
              <span style={styles.summaryLabel}>Steps</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>2</span>
              <span style={styles.summaryLabel}>Adapters</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>1</span>
              <span style={styles.summaryLabel}>Mappings</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryNumber}>1</span>
              <span style={styles.summaryLabel}>Scripts</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={{ ...styles.summaryNumber, color: "#22C55E" }}>● Low</span>
              <span style={styles.summaryLabel}>Complexity</span>
            </div>
          </div>

          {/* KEY COMPONENTS SECTION */}
          <div style={styles.componentsWidget}>
            <h4 style={styles.sectionHeading}>Key Components</h4>
            <div style={styles.componentsGrid}>
              
              <div style={styles.componentCard}>
                <div style={{ ...styles.compIconCircle, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                    <line x1="6" y1="12" x2="18" y2="12" />
                  </svg>
                </div>
                <div style={styles.compInfo}>
                  <span style={styles.compName}>Receiver Adapter</span>
                  <span style={styles.compDesc}>S/4HANA IDoc Adapter</span>
                </div>
              </div>

              <div style={styles.componentCard}>
                <div style={{ ...styles.compIconCircle, backgroundColor: "rgba(111, 66, 255, 0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F42FF" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div style={styles.compInfo}>
                  <span style={styles.compName}>Message Mapping</span>
                  <span style={styles.compDesc}>Employee Data Mapping</span>
                </div>
              </div>

              <div style={styles.componentCard}>
                <div style={{ ...styles.compIconCircle, backgroundColor: "rgba(111, 66, 255, 0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6F42FF" strokeWidth="2.5">
                    <polygon points="12 2 2 22 22 22" />
                  </svg>
                </div>
                <div style={styles.compInfo}>
                  <span style={styles.compName}>Groovy Script</span>
                  <span style={styles.compDesc}>Data Transformation</span>
                </div>
              </div>

              <div style={styles.componentCard}>
                <div style={{ ...styles.compIconCircle, backgroundColor: "rgba(255, 138, 0, 0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div style={styles.compInfo}>
                  <span style={styles.compName}>Data Validation</span>
                  <span style={styles.compDesc}>Validate Employee Data</span>
                </div>
              </div>

              <div style={styles.componentCard}>
                <div style={{ ...styles.compIconCircle, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                    <rect x="2" y="2" width="20" height="20" rx="4" />
                  </svg>
                </div>
                <div style={styles.compInfo}>
                  <span style={styles.compName}>OData Adapter</span>
                  <span style={styles.compDesc}>SuccessFactors OData v2</span>
                </div>
              </div>

            </div>
          </div>

          <a href="#full-design" style={styles.fullDesignLink}>View Full Design</a>

        </div>

        {/* ----------------- COLUMN 3: AI RECOMMENDATIONS PANEL ----------------- */}
        <div style={styles.recommendationsColumnCard} className="glass-panel">
          <div style={styles.cardHeaderRow}>
            <h3 style={styles.formSectionTitle}>AI Recommendations</h3>
            <span style={{ fontSize: "16px" }}>✨</span>
          </div>

          <div style={styles.recommendStack}>
            
            {/* Rec 1 */}
            <div style={{ ...styles.recItem, backgroundColor: "rgba(34, 197, 94, 0.04)", border: "1px solid rgba(34, 197, 94, 0.12)" }} className="hover-scale">
              <div style={{ ...styles.recCircle, backgroundColor: "rgba(34, 197, 94, 0.12)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={styles.recContent}>
                <span style={styles.recName}>Recommended Best Practices</span>
                <span style={styles.recDesc}>Retry, Error Handling and Logging enabled</span>
              </div>
              <a href="#view" style={{ ...styles.recActionLink, color: "#22C55E" }}>View</a>
            </div>

            {/* Rec 2 */}
            <div style={{ ...styles.recItem, backgroundColor: "rgba(111, 66, 255, 0.04)", border: "1px solid rgba(111, 66, 255, 0.12)" }} className="hover-scale">
              <div style={{ ...styles.recCircle, backgroundColor: "rgba(111, 66, 255, 0.12)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6F42FF" strokeWidth="3">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div style={styles.recContent}>
                <span style={styles.recName}>Security</span>
                <span style={styles.recDesc}>OAuth 2.0 authentication recommended</span>
              </div>
              <a href="#view" style={{ ...styles.recActionLink, color: "#6F42FF" }}>View</a>
            </div>

            {/* Rec 3 */}
            <div style={{ ...styles.recItem, backgroundColor: "rgba(10, 132, 255, 0.04)", border: "1px solid rgba(10, 132, 255, 0.12)" }} className="hover-scale">
              <div style={{ ...styles.recCircle, backgroundColor: "rgba(10, 132, 255, 0.12)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div style={styles.recContent}>
                <span style={styles.recName}>Performance</span>
                <span style={styles.recDesc}>Batch processing can improve performance</span>
              </div>
              <a href="#view" style={{ ...styles.recActionLink, color: "#0A84FF" }}>View</a>
            </div>

            {/* Rec 4 */}
            <div style={{ ...styles.recItem, backgroundColor: "rgba(255, 138, 0, 0.04)", border: "1px solid rgba(255, 138, 0, 0.12)" }} className="hover-scale">
              <div style={{ ...styles.recCircle, backgroundColor: "rgba(255, 138, 0, 0.12)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div style={styles.recContent}>
                <span style={styles.recName}>Monitoring</span>
                <span style={styles.recDesc}>Track messages and errors with dashboards</span>
              </div>
              <a href="#view" style={{ ...styles.recActionLink, color: "#FF8A00" }}>View</a>
            </div>

          </div>

          {/* ESTIMATED SAVINGS CARD */}
          <div style={styles.savingsCard}>
            <span style={styles.savingsLabel}>Estimated Savings</span>
            <span style={styles.savingsPercent}>25%</span>
            <span style={styles.savingsDesc}>Reduction in development time with AI-generated iFlow</span>
            
            {/* Sparkline curve pointing upwards */}
            <div style={styles.savingsGraphContainer}>
              <svg width="100%" height="45" viewBox="0 0 120 45">
                <path
                  d="M 5,38 Q 30,35 55,26 T 95,12 T 115,4"
                  fill="none"
                  stroke="var(--accent-purple)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="115" cy="4" r="3.5" fill="var(--accent-purple)" />
              </svg>
            </div>
          </div>

        </div>

      </div>

      {/* Dynamic Keyframes injecting for premium console dot animation */}
      <style>{`
        @keyframes pulseConsoleDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.9); }
        }
        .animate-pulse-dot {
          animation: pulseConsoleDot 2s ease-in-out infinite;
        }
      `}</style>

      {/* ================= AI ORCHESTRATION CONSOLE RESPONSE ================= */}
      {(result || terminalLogs.length > 0) && (
        <section style={styles.consoleCard} className="animate-glow">
          <div style={styles.consoleHeader}>
            <div style={styles.consoleTitleRow}>
              <div style={styles.consoleIndicatorDot} className="animate-pulse-dot" />
              <h3 style={styles.consoleTitle}>IntegrovaX BTP Orchestration Console</h3>
            </div>
            <div style={styles.consoleBadgeRow}>
              {result && (
                <span style={{ 
                  ...styles.statusBadge, 
                  backgroundColor: result.isSimulated ? "rgba(255, 138, 0, 0.1)" : "rgba(34, 197, 94, 0.1)",
                  color: result.isSimulated ? "var(--secondary-orange)" : "var(--success-green)",
                  border: result.isSimulated ? "1px solid rgba(255, 138, 0, 0.2)" : "1px solid rgba(34, 197, 94, 0.2)"
                }}>
                  {result.isSimulated ? "⚠️ Simulation Fallback" : "✓ Active BTP Tenant"}
                </span>
              )}
              {result && (
                <span style={{ 
                  ...styles.statusBadge, 
                  backgroundColor: "rgba(10, 132, 255, 0.1)",
                  color: "var(--primary-blue)",
                  border: "1px solid rgba(10, 132, 255, 0.2)"
                }}>
                  Deployment: {result.deploymentStatus}
                </span>
              )}
              <button 
                type="button"
                onClick={() => { setResult(null); setTerminalLogs([]); }} 
                style={styles.consoleClearBtn}
                title="Clear Console Output"
                className="hover-scale"
              >
                Clear Output
              </button>
            </div>
          </div>

          <div style={styles.consoleContent}>
            
            {/* Top Summaries Block */}
            <div style={styles.consoleSummaries}>
              {/* Package Summary */}
              {packageId && (
                <div style={styles.summaryBox}>
                  <span style={styles.summaryBoxLabel}>Target Package ID</span>
                  <span style={styles.summaryBoxValue}>{packageId}</span>
                </div>
              )}
              {/* iFlow Summary */}
              {customIflowName && (
                <div style={styles.summaryBox}>
                  <span style={styles.summaryBoxLabel}>Integration Flow ID</span>
                  <span style={styles.summaryBoxValue}>{customIflowName}</span>
                </div>
              )}
              {/* AI Spec Summary */}
              {result && result.spec && (
                <div style={styles.summaryBox}>
                  <span style={styles.summaryBoxLabel}>Generated Component Specs</span>
                  <span style={styles.summaryBoxValue}>
                    {result.spec.steps ? `${result.spec.steps.length} MCP Steps Synced` : "Spec Compiled"}
                  </span>
                </div>
              )}
            </div>

            {/* Scrollable Terminal Logger */}
            <div style={styles.terminalLogsContainer}>
              <div style={styles.terminalHeader}>
                <span style={styles.terminalTabActive}>Execution Trace Output Logs</span>
              </div>
              <div style={styles.terminalBody}>
                {terminalLogs.map((logStr, lIdx) => {
                  let color = "#E2E8F0";
                  if (logStr.startsWith("[SUCCESS]")) color = "#22C55E";
                  else if (logStr.startsWith("[WARNING]")) color = "#FF8A00";
                  else if (logStr.startsWith("[ERROR]")) color = "#FF3B30";
                  else if (logStr.startsWith("[PLANNING]")) color = "#C084FC";
                  else if (logStr.startsWith("[EXECUTION]")) color = "#38BDF8";

                  return (
                    <div key={lIdx} style={styles.terminalLine}>
                      <span style={styles.lineNumber}>{(lIdx + 1).toString().padStart(2, '0')}</span>
                      <span style={{ ...styles.logText, color }}>{logStr}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ================= BOTTOM ROW: RECENT IFLOW TEMPLATES ================= */}
      <section style={styles.templatesSection} className="glass-panel">
        <div style={styles.templatesHeader}>
          <h4 style={styles.formSectionTitle}>Recent iFlow Templates</h4>
          <a href="#view-all-templates" style={styles.viewAllTemplatesLink}>View All Templates</a>
        </div>

        <div style={styles.templatesGrid}>
          
          {/* Template 1 */}
          <div
            onClick={() => handleSelectTemplate(
              "S/4HANA to SuccessFactors",
              "Create a secure plan to sync employee master records between SAP S/4HANA ERP and SuccessFactors cloud via secure REST interfaces.",
              "EVENTMesh",
              "S4HANA to SuccessFactors Employee Sync"
            )}
            style={styles.templateCard}
            className="hover-scale"
          >
            <div style={styles.templateCardHeader}>
              <span style={styles.templateName}>S/4HANA to SuccessFactors</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span style={styles.templateSub}>Employee Sync</span>
            
            <div style={styles.templateCardFooter}>
              <div style={styles.systemsIndicator}>
                <span style={styles.templateSysBadge}>SAP</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>➔</span>
                <span style={styles.templateSysBadge}>SAP</span>
              </div>
              <span style={styles.usageIndicator}>● Used 12 times</span>
            </div>
          </div>

          {/* Template 2 */}
          <div
            onClick={() => handleSelectTemplate(
              "Salesforce to S/4HANA",
              "Create and map business partner records dynamically from Salesforce CRM opportunities into SAP S/4HANA OData customer tables.",
              "SFDCSYNC",
              "Salesforce to S/4HANA Customer Sync"
            )}
            style={styles.templateCard}
            className="hover-scale"
          >
            <div style={styles.templateCardHeader}>
              <span style={styles.templateName}>Salesforce to S/4HANA</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span style={styles.templateSub}>Customer Sync</span>
            
            <div style={styles.templateCardFooter}>
              <div style={styles.systemsIndicator}>
                <span style={{ ...styles.templateSysBadge, backgroundColor: "rgba(10, 132, 255, 0.08)", color: "#0A84FF" }}>SFDC</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>➔</span>
                <span style={styles.templateSysBadge}>SAP</span>
              </div>
              <span style={styles.usageIndicator}>● Used 8 times</span>
            </div>
          </div>

          {/* Template 3 */}
          <div
            onClick={() => handleSelectTemplate(
              "Ariba to S/4HANA",
              "Establish secure integration flow to push purchase requisition approvals from SAP Ariba Network to SAP S/4HANA ERP.",
              "PURCHASE",
              "Ariba to S/4HANA PO Integration"
            )}
            style={styles.templateCard}
            className="hover-scale"
          >
            <div style={styles.templateCardHeader}>
              <span style={styles.templateName}>Ariba to S/4HANA</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span style={styles.templateSub}>PO Integration</span>
            
            <div style={styles.templateCardFooter}>
              <div style={styles.systemsIndicator}>
                <span style={{ ...styles.templateSysBadge, backgroundColor: "rgba(255, 138, 0, 0.08)", color: "#FF8A00" }}>ARIBA</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>➔</span>
                <span style={styles.templateSysBadge}>SAP</span>
              </div>
              <span style={styles.usageIndicator}>● Used 6 times</span>
            </div>
          </div>

          {/* Template 4 */}
          <div
            onClick={() => handleSelectTemplate(
              "Event Mesh Notification",
              "Deploy robust messaging consumer subscribing to EVENTMesh notifications and routing triggers into CPI error-analytics pipelines.",
              "EVENTMesh",
              "Event Mesh Notification Flow"
            )}
            style={styles.templateCard}
            className="hover-scale"
          >
            <div style={styles.templateCardHeader}>
              <span style={styles.templateName}>Event Mesh</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span style={styles.templateSub}>Notification Flow</span>
            
            <div style={styles.templateCardFooter}>
              <div style={styles.systemsIndicator}>
                <span style={styles.templateSysBadge}>SAP</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>➔</span>
                <span style={{ ...styles.templateSysBadge, backgroundColor: "rgba(111, 66, 255, 0.08)", color: "#6F42FF" }}>MESH</span>
              </div>
              <span style={styles.usageIndicator}>● Used 15 times</span>
            </div>
          </div>

          {/* Template 5: Northwind Customer Fetch */}
          <div
            onClick={() => handleSelectTemplate(
              "Northwind Customer Fetch",
              "Create an HTTPS-to-OData integration flow for SAP Integration Suite to fetch customer details from the Northwind OData API. The sender HTTPS channel should listen on path /northwind/customers. The receiver OData channel should target https://services.odata.org/V2/Northwind/Northwind.svc/Customers and use OData V2 GET method with no authentication.",
              "EVENTMesh",
              "if_northwind_customer"
            )}
            style={styles.templateCard}
            className="hover-scale"
          >
            <div style={styles.templateCardHeader}>
              <span style={styles.templateName}>Northwind Customer Fetch</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
            <span style={styles.templateSub}>OData API Integration</span>
            
            <div style={styles.templateCardFooter}>
              <div style={styles.systemsIndicator}>
                <span style={{ ...styles.templateSysBadge, backgroundColor: "rgba(10, 132, 255, 0.08)", color: "#0A84FF" }}>HTTPS</span>
                <span style={{ fontSize: "10px", color: "#64748B" }}>➔</span>
                <span style={{ ...styles.templateSysBadge, backgroundColor: "rgba(34, 197, 94, 0.08)", color: "#22C55E" }}>ODATA</span>
              </div>
              <span style={styles.usageIndicator}>● Custom User iFlow</span>
            </div>
          </div>

          {/* Template 5: Create New Template Card */}
          <div style={styles.createTemplateCard} className="hover-scale">
            <div style={styles.createTemplateCircle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div style={styles.createTemplateContent}>
              <span style={styles.createTemplateTitle}>Create New Template</span>
              <span style={styles.createTemplateDesc}>Build a reusable iFlow template</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

/* ================= WIZARD COMPONENT STYLES ================= */
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "28px", // Visual Spacing
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    paddingBottom: "20px"
  },

  consoleCard: {
    background: "rgba(11, 25, 48, 0.96)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(111, 66, 255, 0.25)",
    boxShadow: "0 12px 40px rgba(111, 66, 255, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "24px 28px",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    marginTop: "12px",
    marginBottom: "12px"
  },

  consoleHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    paddingBottom: "14px"
  },

  consoleTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  consoleIndicatorDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#A855F7",
    boxShadow: "0 0 10px #A855F7"
  },

  consoleTitle: {
    fontSize: "14.5px",
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: "0.2px"
  },

  consoleBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  statusBadge: {
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700"
  },

  consoleClearBtn: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#CBD5E1",
    padding: "4px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },

  consoleContent: {
    display: "flex",
    flexDirection: "column",
    gap: "18px"
  },

  consoleSummaries: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  },

  summaryBox: {
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },

  summaryBoxLabel: {
    fontSize: "9.5px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },

  summaryBoxValue: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#FFFFFF"
  },

  terminalLogsContainer: {
    background: "#050B14",
    border: "1px solid rgba(255, 255, 255, 0.05)",
    borderRadius: "10px",
    overflow: "hidden"
  },

  terminalHeader: {
    background: "rgba(255, 255, 255, 0.02)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    padding: "8px 16px"
  },

  terminalTabActive: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent-purple)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  terminalBody: {
    padding: "16px 20px",
    maxHeight: "220px",
    overflowY: "auto",
    fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  terminalLine: {
    display: "flex",
    alignItems: "flex-start",
    fontSize: "12.5px",
    lineHeight: "1.5"
  },

  lineNumber: {
    color: "rgba(255, 255, 255, 0.25)",
    marginRight: "14px",
    userSelect: "none"
  },

  logText: {
    wordBreak: "break-all"
  },

  stepperContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    width: "100%"
  },

  stepCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
  },

  stepNumberCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    backgroundColor: "#F1F5F9",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "700"
  },

  stepTextContainer: {
    display: "flex",
    flexDirection: "column"
  },

  stepTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B"
  },

  stepDesc: {
    fontSize: "10px",
    color: "#94A3B8",
    fontWeight: "500",
    marginTop: "1px"
  },

  wizardGrid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 0.9fr",
    gap: "28px",
    alignItems: "start"
  },

  describeFormCard: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.02)"
  },

  formSectionTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: "-0.2px"
  },

  formSectionSub: {
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "500",
    marginTop: "4px"
  },

  formBody: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    marginTop: "24px"
  },

  formField: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  fieldLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  promptAreaWrapper: {
    position: "relative",
    width: "100%",
    height: "126px",
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid rgba(111, 66, 255, 0.2)",
    boxShadow: "0 4px 18px rgba(111, 66, 255, 0.04)",
    display: "flex",
    alignItems: "stretch",
    padding: "12px 14px",
    overflow: "hidden"
  },

  promptAreaGlow: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at top left, rgba(111, 66, 255, 0.05) 0%, transparent 60%)",
    pointerEvents: "none",
    zIndex: 1
  },

  aiAssistantIcon: {
    position: "absolute",
    top: "12px",
    left: "14px",
    zIndex: 5,
    opacity: 0.8
  },

  promptTextArea: {
    flex: 1,
    height: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    resize: "none",
    fontSize: "12.5px",
    color: "#1E293B",
    fontWeight: "500",
    lineHeight: "1.5",
    paddingLeft: "24px",
    paddingRight: "20px",
    paddingBottom: "12px",
    fontFamily: "inherit",
    zIndex: 2,
    "::placeholder": {
      color: "#94A3B8"
    }
  },

  characterCount: {
    position: "absolute",
    bottom: "10px",
    left: "38px",
    fontSize: "9.5px",
    fontWeight: "600",
    color: "#94A3B8"
  },

  promptCleanBtn: {
    position: "absolute",
    top: "10px",
    right: "12px",
    background: "transparent",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    fontSize: "11px",
    zIndex: 5
  },

  inputsRow: {
    display: "flex",
    gap: "16px"
  },

  roundedInput: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px", // Exactly 12px radius
    padding: "10px 14px",
    fontSize: "12.5px",
    fontWeight: "500",
    color: "#1E293B",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s ease",
    ":focus": {
      borderColor: "var(--primary-blue)",
      boxShadow: "0 0 0 3px rgba(10, 132, 255, 0.1)"
    }
  },

  packageActionRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "-4px"
  },

  secondaryActionBtn: {
    background: "#FFFFFF",
    border: "1px solid var(--primary-blue)",
    borderRadius: "10px",
    padding: "6px 14px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--primary-blue)",
    cursor: "pointer"
  },

  dropdownsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },

  roundedSelect: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px", // Exactly 12px radius
    padding: "10px 14px",
    fontSize: "12.5px",
    fontWeight: "600",
    color: "#475569",
    outline: "none",
    width: "100%",
    cursor: "pointer"
  },

  systemsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  },

  systemIconCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    cursor: "pointer"
  },

  systemIconBadge: {
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  systemDetails: {
    display: "flex",
    flexDirection: "column"
  },

  systemName: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#1E293B"
  },

  systemEnv: {
    fontSize: "9px",
    color: "#64748B",
    fontWeight: "600"
  },

  configDisplayCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "10px 14px",
    display: "flex",
    alignItems: "center"
  },

  formFooterRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px"
  },

  addDetailsBtn: {
    background: "transparent",
    border: "none",
    color: "var(--primary-blue)",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer"
  },

  submitGenerateBtn: {
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(10, 132, 255, 0.25)"
  },

  previewColumnCard: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0, 0,0,0.05), 0 2px 4px rgba(0,0,0,0.02)"
  },

  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "16px",
    marginBottom: "24px"
  },

  draftBadge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#0A84FF",
    backgroundColor: "rgba(10, 132, 255, 0.08)",
    padding: "2px 8px",
    borderRadius: "12px",
    marginRight: "auto",
    marginLeft: "10px"
  },

  regenerateBtn: {
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--primary-blue)"
  },

  diagramPanel: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "20px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px"
  },

  diagramNode: {
    width: "160px",
    background: "#FFFFFF",
    borderRadius: "12px",
    padding: "10px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },

  nodeSubLabel: {
    fontSize: "8.5px",
    color: "#64748B",
    fontWeight: "600",
    textTransform: "uppercase"
  },

  summaryWidget: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "6px",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "12px 10px",
    marginTop: "20px"
  },

  summaryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  summaryNumber: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#1E293B"
  },

  summaryLabel: {
    fontSize: "8.5px",
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: "1px"
  },

  componentsWidget: {
    marginTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  sectionHeading: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#475569"
  },

  componentsGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  componentCard: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "8px 12px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  compIconCircle: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  compInfo: {
    display: "flex",
    flexDirection: "column"
  },

  compName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1E293B"
  },

  compDesc: {
    fontSize: "9.5px",
    color: "#64748B",
    fontWeight: "600"
  },

  fullDesignLink: {
    display: "block",
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--primary-blue)",
    textDecoration: "none",
    marginTop: "20px"
  },

  recommendationsColumnCard: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.02)"
  },

  recommendStack: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "24px"
  },

  recItem: {
    display: "flex",
    alignItems: "center",
    padding: "12px",
    borderRadius: "12px",
    gap: "10px",
    position: "relative",
    cursor: "pointer"
  },

  recCircle: {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  recContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    paddingRight: "40px"
  },

  recName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1E293B"
  },

  recDesc: {
    fontSize: "9.5px",
    color: "#64748B",
    fontWeight: "600"
  },

  recActionLink: {
    position: "absolute",
    right: "12px",
    fontSize: "11px",
    fontWeight: "700",
    textDecoration: "none"
  },

  savingsCard: {
    background: "linear-gradient(135deg, rgba(111, 66, 255, 0.05) 0%, rgba(10, 132, 255, 0.05) 100%)",
    border: "1px solid rgba(111, 66, 255, 0.15)",
    borderRadius: "16px",
    padding: "20px",
    marginTop: "24px",
    display: "flex",
    flexDirection: "column",
    position: "relative"
  },

  savingsLabel: {
    fontSize: "10px",
    fontWeight: "700",
    color: "var(--accent-purple)",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  savingsPercent: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#1E293B",
    marginTop: "4px",
    letterSpacing: "-0.5px"
  },

  savingsDesc: {
    fontSize: "9.5px",
    color: "#64748B",
    fontWeight: "600",
    marginTop: "4px",
    lineHeight: "1.4"
  },

  savingsGraphContainer: {
    marginTop: "10px"
  },

  templatesSection: {
    borderRadius: "16px",
    padding: "24px 28px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.05)"
  },

  templatesHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "12px",
    marginBottom: "16px"
  },

  viewAllTemplatesLink: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--primary-blue)",
    textDecoration: "none"
  },

  templatesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  },

  templateCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    cursor: "pointer"
  },

  templateCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  templateName: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1E293B"
  },

  templateSub: {
    fontSize: "10px",
    color: "#64748B",
    fontWeight: "600",
    marginTop: "2px"
  },

  templateCardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px"
  },

  systemsIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },

  templateSysBadge: {
    fontSize: "8.5px",
    fontWeight: "800",
    backgroundColor: "rgba(10, 132, 255, 0.08)",
    color: "var(--primary-blue)",
    padding: "1px 4px",
    borderRadius: "4px"
  },

  usageIndicator: {
    fontSize: "9px",
    color: "var(--success-green)",
    fontWeight: "700"
  },

  createTemplateCard: {
    background: "#FFFFFF",
    border: "1px dashed var(--primary-blue)",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer"
  },

  createTemplateCircle: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px dashed var(--primary-blue)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  createTemplateContent: {
    display: "flex",
    flexDirection: "column"
  },

  createTemplateTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--primary-blue)"
  },

  createTemplateDesc: {
    fontSize: "9.5px",
    color: "#64748B",
    fontWeight: "500",
    marginTop: "1px"
  }
};
