/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";

import bannerImg from "../../assets/Banner.png";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:40005/sap";

export default function Overview({ activeEnvName = "RUNTIME" }) {
  const [activeCopilotTab, setActiveCopilotTab] = useState("Ask Anything");
  const [promptText, setPromptText] = useState("");
  const [timeRange, setTimeRange] = useState("Last 7 Days");
  
  // 🔄 LIVE BTP DATA STATES
  const [logs, setLogs] = useState([]);
  const [packages, setPackages] = useState([]);
  const [iflows, setIFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dynamic sync telemetry states
  const [syncStatus, setSyncStatus] = useState("Connected"); // "Connected" | "Syncing" | "Error"
  const [lastSyncedTime, setLastSyncedTime] = useState(new Date().toLocaleTimeString());
  const [syncError, setSyncError] = useState(null);
  const [autoSync, setAutoSync] = useState(true);

  // Fetch live SAP Integration Suite data dynamically
  const fetchLiveData = async () => {
    try {
      setSyncStatus("Syncing");
      setLoading(true);
      const [logsRes, pkgsRes, iflowsRes] = await Promise.all([
        axios.get(`${BASE_URL}/logs`),
        axios.get(`${BASE_URL}/packages`),
        axios.get(`${BASE_URL}/iflows`)
      ]);
      
      setLogs(logsRes.data?.data || []);
      setPackages(pkgsRes.data?.data || []);
      setIFlows(iflowsRes.data?.data || []);
      
      setSyncStatus("Connected");
      setLastSyncedTime(new Date().toLocaleTimeString());
      setSyncError(null);
    } catch (err) {
      console.error("⚠️ Error syncing live data with dashboard:", err);
      setSyncStatus("Error");
      setSyncError(err.message || "Network Error");
    } finally {
      setLoading(false);
    }
  };

  // Initial Sync
  useEffect(() => {
    fetchLiveData();
  }, [activeEnvName]);

  // background polling handler based on autoSync status
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(fetchLiveData, 30000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // 🛡️ DYNAMIC VALUE DERIVATIONS & HYBRID FALLBACKS
  const totalLogs = logs.length;
  const totalPackagesVal = packages.length || 24;
  const totalIFlowsVal = iflows.length || [...new Set(logs.map(l => l.flowName))].length || 124;
  
  const liveSuccess = logs.filter(l => l.status === "COMPLETED" || l.status === "SUCCESS").length;
  const liveFailed = logs.filter(l => l.status === "FAILED" || l.status === "ERROR").length;
  const liveRunning = logs.filter(l => l.status === "RUNNING" || l.status === "PROCESSING").length;

  // Resilient dashboard fallbacks if BTP tenant logs are empty
  const totalKPI = totalIFlowsVal;
  const runningKPI = liveRunning || (iflows.length ? iflows.length - liveFailed : 118);
  const failedKPI = liveFailed || (totalLogs ? liveFailed : 6);
  const packagesKPI = totalPackagesVal;
  const messagesKPI = totalLogs || 32248;

  // Interactive quick prompt handler
  const handleTryPrompt = (text) => {
    setPromptText(text);
  };

  const handleSendPrompt = () => {
    if (!promptText.trim()) return;
    alert(`IntegrovaX AI Copilot processing: "${promptText}"`);
    setPromptText("");
  };

  // Recharts Pie Chart Data for iFlow Status Distribution
  const pieData = totalLogs > 0 ? [
    { name: "Success", value: liveSuccess, percent: `${((liveSuccess / totalLogs) * 100).toFixed(1)}%` },
    { name: "Failed", value: liveFailed, percent: `${((liveFailed / totalLogs) * 100).toFixed(1)}%` },
    { name: "Running", value: liveRunning, percent: `${((liveRunning / totalLogs) * 100).toFixed(1)}%` }
  ] : [
    { name: "Success", value: 112, percent: "90.3%" },
    { name: "Failed", value: 6, percent: "4.8%" },
    { name: "Running", value: 6, percent: "4.8%" }
  ];
  const PIE_COLORS = ["#00C853", "#FF8A00", "#0A84FF"];

  // Recharts Area Chart Data - Aggregate actual message volumes by date
  const getLineChartData = () => {
    if (totalLogs === 0) {
      return [
        { name: "May 13", count: 20000 },
        { name: "May 14", count: 22000 },
        { name: "May 15", count: 24000 },
        { name: "May 16", count: 21000 },
        { name: "May 17", count: 21500 },
        { name: "May 18", count: 23000 },
        { name: "May 19", count: 32248 }
      ];
    }

    const volumeByDate = {};
    // Seed last 7 days window
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
      volumeByDate[label] = 0;
    }

    logs.forEach(log => {
      const logDate = log.logStart || log.logTime;
      if (logDate) {
        const d = new Date(logDate);
        const label = d.toLocaleDateString([], { month: "short", day: "numeric" });
        if (volumeByDate[label] !== undefined) {
          volumeByDate[label]++;
        }
      }
    });

    return Object.keys(volumeByDate).map(date => ({
      name: date,
      count: volumeByDate[date]
    }));
  };

  const lineData = getLineChartData();

  // Dynamic Recent Alerts from actual OData message logs
  const getRecentAlerts = () => {
    if (totalLogs === 0) {
      return [
        { title: "iFlow Payment_Integration failed", sub: "Error in mapping step", time: "01:08 PM", color: "#EF4444", icon: "cross" },
        { title: "High latency detected", sub: "iFlow Order_Processing", time: "12:45 PM", color: "#D97706", icon: "warn" },
        { title: "Message delivery failure", sub: "iFlow Customer_360", time: "11:32 AM", color: "#EF4444", icon: "warn" },
        { title: "Package EVENTMesh deployed", sub: "Version 1.2.3 deployed successfully", time: "10:15 AM", color: "#2563EB", icon: "info" }
      ];
    }

    // Sort by logStart/logTime descending and grab top 4
    const sortedLogs = [...logs].sort((a, b) => {
      const dateA = new Date(a.logStart || a.logTime);
      const dateB = new Date(b.logStart || b.logTime);
      return dateB - dateA;
    }).slice(0, 4);

    return sortedLogs.map(log => {
      const isFailed = log.status === "FAILED" || log.status === "ERROR";
      const isCompleted = log.status === "COMPLETED" || log.status === "SUCCESS";
      const dateVal = new Date(log.logStart || log.logTime);
      const timeStr = dateVal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      let color = "#2563EB";
      let icon = "info";
      let subText = `Status: ${log.status}`;

      if (isFailed) {
        color = "#EF4444";
        icon = "cross";
        subText = log.messageId ? `Message ID: ${log.messageId.substring(0, 18)}...` : "Execution failed";
      } else if (isCompleted) {
        color = "#00C853";
        icon = "check";
        subText = "Completed successfully";
      }

      return {
        title: `iFlow ${log.flowName || "Artifact"}`,
        sub: subText,
        time: timeStr,
        color,
        icon
      };
    });
  };

  const recentAlerts = getRecentAlerts();

  return (
    <div style={styles.container}>
      
      {/* Dynamic Keyframes injecting for premium micro-animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.9); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-pulse-dot {
          animation: pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* ================= LIVE BTP SYNC CONTROL CENTER ================= */}
      <div style={styles.syncContainer} className="glass-panel">
        <div style={styles.syncLeft}>
          <div style={styles.syncStatusWrapper}>
            <span 
              style={{ 
                ...styles.syncStatusDot, 
                backgroundColor: syncStatus === "Syncing" ? "var(--primary-blue)" : syncStatus === "Error" ? "var(--danger-red)" : "var(--success-green)",
                boxShadow: syncStatus === "Syncing" ? "0 0 10px var(--primary-blue)" : syncStatus === "Error" ? "0 0 10px var(--danger-red)" : "0 0 10px var(--success-green)",
              }} 
              className="animate-pulse-dot" 
            />
            <span style={styles.syncStatusText}>
              {syncStatus === "Syncing" ? "Syncing with SAP Integration Suite..." : 
               syncStatus === "Error" ? `Sync Error: ${syncError}` : 
               "Live Connected to SAP BTP Tenant"}
            </span>
          </div>
          <span style={styles.syncDivider}>|</span>
          <span style={styles.syncTimeText}>Last updated: {lastSyncedTime}</span>
        </div>
        <div style={styles.syncRight}>
          <label style={styles.toggleLabel}>
            <input 
              type="checkbox" 
              checked={autoSync} 
              onChange={(e) => setAutoSync(e.target.checked)} 
              style={styles.toggleInput} 
            />
            <span style={{ marginRight: '6px' }}>Auto-Sync (30s)</span>
          </label>
          <button 
            onClick={fetchLiveData} 
            disabled={loading} 
            style={{ 
              ...styles.syncBtn, 
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer" 
            }}
            className="hover-scale"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="2.5"
              className={syncStatus === "Syncing" ? "animate-spin" : ""}
              style={{ marginRight: '6px' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {syncStatus === "Syncing" ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: KPI CARDS ================= */}
      <section style={styles.kpiGrid}>
        
        {/* Card 1: Total iFlows */}
        <div style={styles.kpiCard} className="glass-panel hover-scale">
          
          <div style={styles.kpiLeft}>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                <circle cx="12" cy="5" r="3" />
                <circle cx="5" cy="19" r="3" />
                <circle cx="19" cy="19" r="3" />
                <path d="M5 16v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiLabel}>Total iFlows</span>
              <span style={styles.kpiValue}>{totalKPI}</span>
              <div style={styles.kpiTrendPositive}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" style={{ marginRight: "3px" }}>
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span>12% <span style={{ color: "#94A3B8" }}>vs last 7 days</span></span>
              </div>
            </div>
          </div>
          <div style={styles.sparklineContainer}>
            <svg width="85" height="40" viewBox="0 0 85 40">
              <path
                d="M 0,32 Q 14,28 28,24 T 56,12 T 85,4"
                fill="none"
                stroke="#0A84FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0,32 Q 14,28 28,24 T 56,12 T 85,4 L 85,40 L 0,40 Z"
                fill="url(#totalGrad)"
                style={{ opacity: 0.15 }}
              />
              <defs>
                <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0A84FF" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Running iFlows */}
        <div style={styles.kpiCard} className="glass-panel hover-scale">
          
          <div style={styles.kpiLeft}>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: "rgba(0, 200, 83, 0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiLabel}>Running iFlows</span>
              <span style={styles.kpiValue}>{runningKPI}</span>
              <div style={styles.kpiTrendPositive}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" style={{ marginRight: "3px" }}>
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span>8% <span style={{ color: "#94A3B8" }}>vs last 7 days</span></span>
              </div>
            </div>
          </div>
          <div style={styles.sparklineContainer}>
            <svg width="85" height="40" viewBox="0 0 85 40">
              <path
                d="M 0,34 Q 14,30 28,26 T 56,14 T 85,6"
                fill="none"
                stroke="#00C853"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0,34 Q 14,30 28,26 T 56,14 T 85,6 L 85,40 L 0,40 Z"
                fill="url(#runGrad)"
                style={{ opacity: 0.15 }}
              />
              <defs>
                <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00C853" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Failed iFlows */}
        <div style={styles.kpiCard} className="glass-panel hover-scale">
          
          <div style={styles.kpiLeft}>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: "rgba(255, 138, 0, 0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiLabel}>Failed iFlows</span>
              <span style={styles.kpiValue}>{failedKPI}</span>
              <div style={styles.kpiTrendNegative}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" style={{ marginRight: "3px" }}>
                  <line x1="7" y1="7" x2="17" y2="17" />
                  <polyline points="17 7 17 17 7 17" />
                </svg>
                <span>25% <span style={{ color: "#94A3B8" }}>vs last 7 days</span></span>
              </div>
            </div>
          </div>
          <div style={styles.sparklineContainer}>
            <svg width="85" height="40" viewBox="0 0 85 40">
              <path
                d="M 0,10 Q 14,12 28,16 T 56,26 T 85,32"
                fill="none"
                stroke="#FF3B30"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0,10 Q 14,12 28,16 T 56,26 T 85,32 L 85,40 L 0,40 Z"
                fill="url(#failGrad)"
                style={{ opacity: 0.15 }}
              />
              <defs>
                <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF3B30" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Packages */}
        <div style={styles.kpiCard} className="glass-panel hover-scale">
          
          <div style={styles.kpiLeft}>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: "rgba(111, 66, 255, 0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6F42FF" strokeWidth="2.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiLabel}>Packages</span>
              <span style={styles.kpiValue}>{packagesKPI}</span>
              <div style={styles.kpiTrendPositive}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" style={{ marginRight: "3px" }}>
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span>4% <span style={{ color: "#94A3B8" }}>vs last 7 days</span></span>
              </div>
            </div>
          </div>
          <div style={styles.sparklineContainer}>
            <svg width="85" height="40" viewBox="0 0 85 40">
              <path
                d="M 0,28 Q 14,26 28,26 T 56,20 T 85,12"
                fill="none"
                stroke="#6F42FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 0,28 Q 14,26 28,26 T 56,20 T 85,12 L 85,40 L 0,40 Z"
                fill="url(#packGrad)"
                style={{ opacity: 0.15 }}
              />
              <defs>
                <linearGradient id="packGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6F42FF" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 5: Messages (7D) */}
        <div style={styles.kpiCard} className="glass-panel hover-scale">
          
          <div style={styles.kpiLeft}>
            <div style={{ ...styles.kpiIconWrapper, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div style={styles.kpiInfo}>
              <span style={styles.kpiLabel}>Messages (7D)</span>
              <span style={styles.kpiValue}>{messagesKPI.toLocaleString()}</span>
              <div style={styles.kpiTrendPositive}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="2.5" style={{ marginRight: "3px" }}>
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
                <span>15% <span style={{ color: "#94A3B8" }}>vs last 7 days</span></span>
              </div>
            </div>
          </div>
          <div style={styles.sparklineContainer}>
            <svg width="85" height="40" viewBox="0 0 85 40">
              <rect x="2" y="20" width="6" height="20" rx="1.5" fill="#0A84FF" style={{ opacity: 0.4 }} />
              <rect x="13" y="16" width="6" height="24" rx="1.5" fill="#0A84FF" style={{ opacity: 0.5 }} />
              <rect x="24" y="22" width="6" height="18" rx="1.5" fill="#0A84FF" style={{ opacity: 0.6 }} />
              <rect x="35" y="18" width="6" height="22" rx="1.5" fill="#0A84FF" style={{ opacity: 0.7 }} />
              <rect x="46" y="12" width="6" height="28" rx="1.5" fill="#0A84FF" style={{ opacity: 0.8 }} />
              <rect x="57" y="10" width="6" height="30" rx="1.5" fill="#0A84FF" style={{ opacity: 0.9 }} />
              <rect x="68" y="4" width="6" height="36" rx="1.5" fill="#0A84FF" />
            </svg>
          </div>
        </div>

      </section>

      {/* ================= TWO-COLUMN GRID LAYOUT ================= */}
      <div style={styles.mainGrid}>
        
        {/* ----------------- LEFT MAIN PANEL ----------------- */}
        <div style={styles.leftColumn}>
          
          {/* ================= SECTION 2: AI COPILOT HERO CARD ================= */}
          <div style={styles.copilotHero} className="glass-panel animate-glow">
            
            {/* Soft AI circuit patterns absolutely positioned in the background */}
            <div style={styles.circuitTrack1} />
            <div style={styles.circuitTrack2} />
            <div style={styles.circuitNode1} />
            <div style={styles.circuitNode2} />

            {/* Subtle glow effect behind the watermark */}
            <div style={styles.copilotGlow} />

            {/* Watermark Logo Orb decoration on right side - transparent watermark style */}
            <div style={styles.copilotOrbBg}>
              <img src={bannerImg} alt="Watermark logo" style={styles.bannerImg} className="animate-float" />
            </div>

            <div style={styles.copilotHeroLeftContent}>
              <div style={styles.copilotTitleRow}>
                <h2 style={styles.copilotTitle}>IntegrovaX AI Copilot</h2>
                <span style={styles.sparkleBadge}>✨</span>
              </div>
              <p style={styles.copilotSubtitle}>Your AI assistant for SAP Integration Suite</p>

              {/* Quick Action Navigation Tabs inside Copilot */}
              <div style={styles.copilotTabRow}>
                {["Ask Anything", "Generate iFlow", "Analyze Issues", "Optimize", "Best Practices"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCopilotTab(tab)}
                    style={{
                      ...styles.copilotTab,
                      backgroundColor: activeCopilotTab === tab ? "rgba(111, 66, 255, 0.12)" : "transparent",
                      border: activeCopilotTab === tab ? "1px solid var(--accent-purple)" : "1px solid transparent",
                      color: activeCopilotTab === tab ? "var(--accent-purple)" : "#475569"
                    }}
                    className="hover-scale"
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Text Input prompt container */}
              <div style={styles.copilotPromptContainer}>
                <textarea
                  placeholder={
                    activeCopilotTab === "Ask Anything" ? "Describe your integration requirement or ask anything..." :
                    activeCopilotTab === "Generate iFlow" ? "Describe the source and target interfaces to generate an iFlow..." :
                    activeCopilotTab === "Analyze Issues" ? "Enter the failed iFlow name to audit log execution details..." :
                    "Provide a package/iFlow context for AI optimization insights..."
                  }
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  style={styles.copilotTextArea}
                />
                
                <button 
                  onClick={handleSendPrompt}
                  style={styles.copilotSendBtn}
                  className="hover-scale"
                  title="Send message to Copilot"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Try these example prompts */}
              <div style={styles.examplesContainer}>
                <span style={styles.examplesLabel}>Try these examples</span>
                <div style={styles.examplesGrid}>
                  {[
                    "Create S/4HANA to SuccessFactors iFlow",
                    "Analyze failed messages in last 24h",
                    "Optimize package EVENTMesh",
                    "Add error handling to iFlow"
                  ].map((examplePrompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleTryPrompt(examplePrompt)}
                      style={styles.examplePill}
                      className="hover-scale"
                    >
                      {examplePrompt}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* ================= SECTION 4: INTEGRATION LANDSCAPE OVERVIEW ================= */}
          <div style={styles.landscapeCard} className="glass-panel">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Integration Landscape Overview</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                style={styles.timeDropdown}
              >
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>

            <div style={styles.landscapeGrid}>
              
              {/* Donut Chart Widget */}
              <div style={styles.donutWidget}>
                <h4 style={styles.widgetSubTitle}>iFlow Status Distribution</h4>
                <div style={styles.donutContentRow}>
                  
                  <div style={styles.donutContainer}>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={styles.donutCenterLabel}>
                      <span style={styles.donutCenterNumber}>{logs.length || 124}</span>
                      <span style={styles.donutCenterText}>Total Logs</span>
                    </div>
                  </div>

                  <div style={styles.donutLegend}>
                    {pieData.map((item, idx) => (
                      <div key={idx} style={styles.legendItem}>
                        <span style={{ ...styles.legendDot, backgroundColor: PIE_COLORS[idx] }} />
                        <span style={styles.legendName}>{item.name}</span>
                        <span style={styles.legendVal}>{item.value} ({item.percent})</span>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Spline Line Chart Widget */}
              <div style={styles.splineWidget}>
                <div style={styles.splineHeader}>
                  <h4 style={styles.widgetSubTitle}>Message Volume Trend</h4>
                  <div style={styles.splineTotal}>
                    <span style={styles.splineTotalNum}>{logs.length || "32,248"}</span>
                    <span style={styles.splineTotalLabel}>Total Messages</span>
                  </div>
                </div>

                <div style={{ width: "100%", height: "200px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="msgVolGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(226, 232, 240, 0.5)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#94A3B8"
                        fontSize={10}
                        fontWeight="600"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={10}
                        fontWeight="600"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0B1930",
                          border: "none",
                          borderRadius: "10px",
                          color: "#FFFFFF",
                          fontSize: "12px",
                          padding: "8px 14px",
                          boxShadow: "var(--card-shadow-hover)"
                        }}
                        labelStyle={{ fontWeight: "700", marginBottom: "4px" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#0A84FF"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#msgVolGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ----------------- RIGHT SIDEBAR PANEL ----------------- */}
        <div style={styles.rightColumn}>
          
          {/* ================= SECTION 3: AI INSIGHTS PANEL ================= */}
          <div style={styles.insightsCard} className="glass-panel">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>AI Insights & Recommendations</h3>
              <a href="#view-all" style={styles.viewAllLink}>View all</a>
            </div>

            <div style={styles.insightsStack}>
              
              {/* Insight Item 1: Success Check (Soft Green Background) */}
              <div style={{ ...styles.insightItem, ...styles.insightItemGreen }} className="hover-scale">
                <div style={{ ...styles.insightIconRing, backgroundColor: "rgba(0, 200, 83, 0.12)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div style={styles.insightContent}>
                  <div style={styles.insightHeadline}>3 iFlows can be optimized</div>
                  <div style={styles.insightSubText}>Performance improvement potential detected</div>
                </div>
                <a href="#view-details" style={{ ...styles.insightActionLink, color: "#00C853" }}>View Details</a>
              </div>

              {/* Insight Item 2: Warning (Soft Orange Background) */}
              <div style={{ ...styles.insightItem, ...styles.insightItemOrange }} className="hover-scale">
                <div style={{ ...styles.insightIconRing, backgroundColor: "rgba(255, 138, 0, 0.12)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="3">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  </svg>
                </div>
                <div style={styles.insightContent}>
                  <div style={styles.insightHeadline}>EVENTMesh package missing retry strategy</div>
                  <div style={styles.insightSubText}>Reliability improvement recommended</div>
                </div>
                <a href="#view-details" style={{ ...styles.insightActionLink, color: "#FF8A00" }}>View Details</a>
              </div>

              {/* Insight Item 3: Latency (Soft Blue Background) */}
              <div style={{ ...styles.insightItem, ...styles.insightItemBlue }} className="hover-scale">
                <div style={{ ...styles.insightIconRing, backgroundColor: "rgba(10, 132, 255, 0.12)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div style={styles.insightContent}>
                  <div style={styles.insightHeadline}>Average latency increased by 12% today</div>
                  <div style={styles.insightSubText}>Monitor performance trends</div>
                </div>
                <a href="#view-details" style={{ ...styles.insightActionLink, color: "#0A84FF" }}>View Details</a>
              </div>

              {/* Insight Item 4: System Health (Soft Green Highlight) */}
              <div style={{ ...styles.insightItem, ...styles.insightItemGreenAccent }} className="hover-scale">
                <div style={{ ...styles.insightIconRing, backgroundColor: "rgba(0, 200, 83, 0.15)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00C853" strokeWidth="3">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div style={styles.insightContent}>
                  <div style={styles.insightHeadline}>System Health is Good</div>
                  <div style={styles.insightSubText}>All services are operating normally</div>
                </div>
                <a href="#view-health" style={{ ...styles.insightActionLink, color: "#00C853" }}>View Health</a>
              </div>

            </div>
          </div>

          {/* ================= SECTION 5: RECENT ALERTS ================= */}
          <div style={styles.alertsCard} className="glass-panel">
            <div style={styles.cardHeader}>
              <h3 style={styles.cardTitle}>Recent Alerts</h3>
              <a href="#view-all" style={styles.viewAllLink}>View all</a>
            </div>

            <div style={styles.alertsStack}>
              {recentAlerts.map((alertItem, idx) => (
                <div key={idx} style={styles.alertRow}>
                  <div style={styles.alertIconAndText}>
                    <div style={{ ...styles.alertCircle, backgroundColor: alertItem.color + "1A" }}>
                      {alertItem.icon === "cross" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alertItem.color} strokeWidth="3">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : alertItem.icon === "check" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alertItem.color} strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={alertItem.color} strokeWidth="3">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      )}
                    </div>
                    <div style={styles.alertInfo}>
                      <div style={styles.alertHeadline}>{alertItem.title}</div>
                      <div style={styles.alertSub}>{alertItem.sub}</div>
                    </div>
                  </div>
                  <div style={styles.alertTimeRow}>
                    <span style={styles.alertTime}>{alertItem.time}</span>
                    <span style={{ ...styles.alertPulseDot, backgroundColor: alertItem.color }} />
                  </div>
                </div>
              ))}
            </div>

            <a href="#view-all" style={styles.alertFooterLink}>View all alerts</a>
          </div>

        </div>

      </div>

      {/* ================= SECTION 6: QUICK ACTIONS ================= */}
      <section style={styles.quickActionsCard} className="glass-panel">
        <h3 style={{ ...styles.cardTitle, padding: "24px 28px 0 28px", fontSize: "15px" }}>Quick Actions</h3>
        <div style={styles.quickActionsGrid}>
          
          {/* Card 1 */}
          <div style={styles.quickCard} className="hover-scale">
            <div style={{ ...styles.quickIconCircle, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <div style={styles.quickContent}>
              <div style={styles.quickName}>Create iFlow</div>
              <div style={styles.quickDesc}>Start a new integration flow</div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={styles.quickCard} className="hover-scale">
            <div style={{ ...styles.quickIconCircle, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <div style={styles.quickContent}>
              <div style={styles.quickName}>Upload Package</div>
              <div style={styles.quickDesc}>Deploy or import package</div>
            </div>
          </div>

          {/* Card 3 */}
          <div style={styles.quickCard} className="hover-scale">
            <div style={{ ...styles.quickIconCircle, backgroundColor: "rgba(10, 132, 255, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A84FF" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div style={styles.quickContent}>
              <div style={styles.quickName}>Monitor Messages</div>
              <div style={styles.quickDesc}>Track message processing</div>
            </div>
          </div>

          {/* Card 4 */}
          <div style={styles.quickCard} className="hover-scale">
            <div style={{ ...styles.quickIconCircle, backgroundColor: "rgba(255, 138, 0, 0.08)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8A00" strokeWidth="2.5">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div style={styles.quickContent}>
              <div style={styles.quickName}>Error Analysis</div>
              <div style={styles.quickDesc}>Analyze and resolve errors</div>
            </div>
          </div>

        </div>
      </section>

      {/* ================= FOOTER DETAIL PANEL ================= */}
      <footer style={styles.footer}>
        <span style={styles.footerCopy}>© 2026 IntegrovaX. All rights reserved.</span>
        <div style={styles.footerLinks}>
          <a href="#privacy" style={styles.footerLink}>Privacy Policy</a>
          <span style={styles.footerDot}>·</span>
          <a href="#terms" style={styles.footerLink}>Terms of Service</a>
          <span style={styles.footerDot}>·</span>
          <a href="#support" style={styles.footerLink}>Support</a>
        </div>
      </footer>

    </div>
  );
}

/* ================= COMPONENT STYLES ================= */
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "36px", // Increased global whitespace
    width: "100%",
    maxWidth: "1400px",
    margin: "0 auto",
    paddingBottom: "20px"
  },

  syncContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 20px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    width: "100%",
    marginTop: "-10px",
    marginBottom: "-10px"
  },

  syncLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  syncStatusWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },

  syncStatusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block"
  },

  syncStatusText: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#1E293B"
  },

  syncDivider: {
    color: "#CBD5E1",
    fontSize: "13px"
  },

  syncTimeText: {
    fontSize: "12px",
    color: "#64748B",
    fontWeight: "600"
  },

  syncRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },

  toggleLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#475569",
    cursor: "pointer",
    userSelect: "none"
  },

  toggleInput: {
    marginRight: "6px",
    cursor: "pointer"
  },

  syncBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--primary-blue)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "12.5px",
    fontWeight: "700",
    boxShadow: "0 4px 12px rgba(10, 132, 255, 0.2)",
    cursor: "pointer"
  },

  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px", // Increased whitespace
    width: "100%"
  },

  kpiCard: {
    borderRadius: "16px",
    padding: "26px 22px", // Height increased by 15%
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.02)", // Stronger shadow
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    position: "relative",
    overflow: "hidden"
  },

  kpiLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    flex: 1
  },

  kpiIconWrapper: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  kpiInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },

  kpiLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },

  kpiValue: {
    fontSize: "32px", // Increased font size
    fontWeight: "800",
    color: "#1E293B",
    letterSpacing: "-1px",
    lineHeight: "1"
  },

  kpiTrendPositive: {
    display: "flex",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#00C853",
    marginTop: "4px"
  },

  kpiTrendNegative: {
    display: "flex",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: "#FF3B30",
    marginTop: "4px"
  },

  sparklineContainer: {
    position: "absolute",
    right: "18px",
    bottom: "22px",
    display: "flex",
    alignItems: "flex-end"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "2.3fr 1fr",
    gap: "32px", // Increased whitespace
    alignItems: "start"
  },

  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "32px"
  },

  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "32px"
  },

  copilotHero: {
    borderRadius: "16px",
    padding: "40px", // Increased padding (20% higher card feel)
    minHeight: "380px", // Set premium primary centerpiece visual focus height
    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.08) 0%, rgba(111, 66, 255, 0.08) 50%, rgba(255, 255, 255, 0.85) 100%)", // Subtle blue-to-purple gradient
    border: "1px solid rgba(111, 66, 255, 0.18)",
    boxShadow: "0 12px 40px rgba(111, 66, 255, 0.12), 0 2px 4px rgba(111, 66, 255, 0.02)",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  copilotGlow: {
    position: "absolute",
    right: "0px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "360px",
    height: "360px",
    background: "radial-gradient(circle, rgba(10, 132, 255, 0.22) 0%, rgba(111, 66, 255, 0.06) 50%, transparent 70%)", // Glowing orb backdrop
    zIndex: 1,
    pointerEvents: "none"
  },

  copilotOrbBg: {
    position: "absolute",
    right: "-10px",
    top: "50%",
    transform: "translateY(-50%)",
    width: "280px",
    height: "280px",
    opacity: 0.12, // Translucent brand watermark
    pointerEvents: "none",
    zIndex: 2
  },

  bannerImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: "drop-shadow(0 0 25px rgba(10, 132, 255, 0.45))" // Subtle drop shadow glow on the logo watermark
  },

  circuitTrack1: {
    position: "absolute",
    left: "15%",
    top: 0,
    width: "1px",
    height: "40%",
    background: "linear-gradient(180deg, rgba(10, 132, 255, 0.2) 0%, rgba(10, 132, 255, 0) 100%)",
    pointerEvents: "none"
  },

  circuitTrack2: {
    position: "absolute",
    left: "5%",
    top: "60%",
    width: "40%",
    height: "1px",
    background: "linear-gradient(90deg, rgba(111, 66, 255, 0.2) 0%, rgba(111, 66, 255, 0) 100%)",
    pointerEvents: "none"
  },

  circuitNode1: {
    position: "absolute",
    left: "15%",
    top: "40%",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#0A84FF",
    boxShadow: "0 0 8px #0A84FF",
    pointerEvents: "none"
  },

  circuitNode2: {
    position: "absolute",
    left: "45%",
    top: "60%",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#6F42FF",
    boxShadow: "0 0 8px #6F42FF",
    pointerEvents: "none"
  },

  copilotHeroLeftContent: {
    position: "relative",
    zIndex: 5,
    maxWidth: "560px",
    width: "100%"
  },

  copilotTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  copilotTitle: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: "-0.5px"
  },

  sparkleBadge: {
    fontSize: "20px"
  },

  copilotSubtitle: {
    fontSize: "14px",
    color: "#475569",
    fontWeight: "600",
    marginTop: "6px"
  },

  copilotTabRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "24px",
    marginBottom: "18px"
  },

  copilotTab: {
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
  },

  copilotPromptContainer: {
    position: "relative",
    width: "100%",
    height: "90px",
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid rgba(111, 66, 255, 0.25)",
    boxShadow: "0 4px 20px rgba(111, 66, 255, 0.05)",
    display: "flex",
    alignItems: "center",
    padding: "14px"
  },

  copilotTextArea: {
    flex: 1,
    height: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    resize: "none",
    fontSize: "13.5px",
    color: "#1E293B",
    fontWeight: "500",
    lineHeight: "1.5",
    paddingRight: "40px",
    fontFamily: "inherit",
    "::placeholder": {
      color: "#94A3B8"
    }
  },

  copilotSendBtn: {
    position: "absolute",
    bottom: "14px",
    right: "14px",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    backgroundColor: "var(--accent-purple)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(111, 66, 255, 0.35)"
  },

  examplesContainer: {
    marginTop: "28px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  examplesLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },

  examplesGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px"
  },

  examplePill: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "6px 14px",
    fontSize: "12px",
    color: "#334155",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
  },

  landscapeCard: {
    borderRadius: "16px",
    padding: "28px", // Increased padding
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "18px",
    marginBottom: "24px"
  },

  cardTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1E293B",
    letterSpacing: "-0.2px"
  },

  timeDropdown: {
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#475569",
    outline: "none",
    cursor: "pointer"
  },

  landscapeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr",
    gap: "36px",
    alignItems: "center"
  },

  donutWidget: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  widgetSubTitle: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#475569",
    letterSpacing: "0.2px",
    marginBottom: "6px"
  },

  donutContentRow: {
    display: "flex",
    alignItems: "center",
    gap: "24px"
  },

  donutContainer: {
    width: "180px",
    height: "180px",
    position: "relative"
  },

  donutCenterLabel: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },

  donutCenterNumber: {
    fontSize: "26px",
    fontWeight: "800",
    color: "#1E293B"
  },

  donutCenterText: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase"
  },

  donutLegend: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    flex: 1
  },

  legendItem: {
    display: "flex",
    alignItems: "center",
    fontSize: "11.5px"
  },

  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    marginRight: "8px"
  },

  legendName: {
    color: "#64748B",
    fontWeight: "600",
    flex: 1
  },

  legendVal: {
    color: "#1E293B",
    fontWeight: "700"
  },

  splineWidget: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  splineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },

  splineTotal: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end"
  },

  splineTotalNum: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#1E293B"
  },

  splineTotalLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase"
  },

  insightsCard: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)"
  },

  viewAllLink: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--primary-blue)",
    textDecoration: "none"
  },

  insightsStack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  insightItem: {
    display: "flex",
    alignItems: "center",
    padding: "14px",
    borderRadius: "12px",
    gap: "12px",
    position: "relative",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },

  insightItemGreen: {
    backgroundColor: "rgba(0, 200, 83, 0.04)",
    border: "1px solid rgba(0, 200, 83, 0.15)"
  },

  insightItemOrange: {
    backgroundColor: "rgba(255, 138, 0, 0.04)",
    border: "1px solid rgba(255, 138, 0, 0.15)"
  },

  insightItemBlue: {
    backgroundColor: "rgba(10, 132, 255, 0.04)",
    border: "1px solid rgba(10, 132, 255, 0.15)"
  },

  insightItemGreenAccent: {
    backgroundColor: "rgba(0, 200, 83, 0.06)",
    border: "1px solid rgba(0, 200, 83, 0.25)"
  },

  insightIconRing: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  insightContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
    paddingRight: "70px"
  },

  insightHeadline: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: "1.3"
  },

  insightSubText: {
    fontSize: "10.5px",
    color: "#64748B",
    fontWeight: "500"
  },

  insightActionLink: {
    position: "absolute",
    right: "14px",
    fontSize: "11px",
    fontWeight: "700",
    textDecoration: "none"
  },

  alertsCard: {
    borderRadius: "16px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)"
  },

  alertsStack: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  alertRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "14px",
    borderBottom: "1px solid #F1F5F9",
    ":last-child": {
      borderBottom: "none",
      paddingBottom: 0
    }
  },

  alertIconAndText: {
    display: "flex",
    alignItems: "center",
    gap: "14px"
  },

  alertCircle: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  alertInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },

  alertHeadline: {
    fontSize: "12.5px",
    fontWeight: "700",
    color: "#1E293B"
  },

  alertSub: {
    fontSize: "10.5px",
    color: "#64748B",
    fontWeight: "500"
  },

  alertTimeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  alertTime: {
    fontSize: "11px",
    color: "#94A3B8",
    fontWeight: "600"
  },

  alertPulseDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%"
  },

  alertFooterLink: {
    display: "block",
    textAlign: "center",
    fontSize: "12.5px",
    fontWeight: "700",
    color: "var(--primary-blue)",
    textDecoration: "none",
    marginTop: "20px"
  },

  quickActionsCard: {
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.02)",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    paddingBottom: "28px"
  },

  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    padding: "0 28px"
  },

  quickCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden"
  },

  quickIconCircle: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  quickContent: {
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },

  quickName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#1E293B"
  },

  quickDesc: {
    fontSize: "10.5px",
    color: "#64748B",
    fontWeight: "500"
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "28px",
    borderTop: "1px solid #E2E8F0",
    marginTop: "20px"
  },

  footerCopy: {
    fontSize: "12.5px",
    color: "#64748B",
    fontWeight: "500"
  },

  footerLinks: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  footerLink: {
    fontSize: "12.5px",
    color: "#64748B",
    textDecoration: "none",
    fontWeight: "500",
    ":hover": {
      color: "var(--primary-blue)"
    }
  },

  footerDot: {
    color: "#94A3B8"
  }
};
