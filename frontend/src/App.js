/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Overview from "./pages/Overview/Overview";
import MessageFlows from "./pages/MessageFlows/MessageFlows";
import ErrorAnalysis from "./pages/ErrorAnalysis/ErrorAnalysis";
import SystemHealth from "./pages/SystemHealth/SystemHealth";
import PackagesAndIFlows from "./pages/PackagesAndIFlows/PackagesAndIFlows";
import IFlowBuilder from "./pages/IFlowBuilder/IFlowBuilder";
import Simulators from "./pages/Simulators/Simulators";

export default function App() {
  const [tab, setTab] = useState("Overview");
  const [env, setEnv] = useState("PRODUCTION");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const renderPage = () => {
    switch (tab) {
      case "Overview":
        return <Overview />;
      case "Message Flows":
        return <MessageFlows />;
      case "Error Analysis":
        return <ErrorAnalysis />;
      case "System Health":
        return <SystemHealth />;
      case "Packages and iFlows":
        return <PackagesAndIFlows />;
      case "iFlow Builder":
        return <IFlowBuilder />;
      case "Simulators":
        return <Simulators />;
      default:
        // Render a gorgeous advanced placeholder for other sidebar tabs
        return <AdvancedModulePlaceholder tabName={tab} setTab={setTab} />;
    }
  };

  return (
    <div style={styles.app}>
      {/* 🚀 LEFT SIDEBAR (PREMIUM & COLLAPSIBLE) */}
      <Sidebar activeTab={tab} setTab={setTab} />

      {/* 🖥️ MAIN CONTENT AREA */}
      <div style={styles.mainContainer}>
        {/* 🛡️ TOP HEADER */}
        <header style={styles.header}>
          
          {/* SEARCH BAR (linear/vercel style) */}
          <div style={styles.searchContainer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px' }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Ask IntegrovaX or type a command..."
              style={styles.searchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <div style={styles.shortcutBadge}>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 'bold' }}>⌘ K</span>
            </div>
          </div>

          {/* RIGHT SIDE USER AND ENVIRONMENT MODULES */}
          <div style={styles.headerRight}>
            
            {/* ENVIRONMENT SELECTOR PILL */}
            <div style={styles.envSelectorWrapper}>
              <button style={styles.envButton}>
                <span style={styles.envIndicator}>●</span>
                <span style={{ fontWeight: "600", fontSize: "12px", color: "#1E293B" }}>{env}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* NOTIFICATIONS BELL */}
            <div style={{ position: "relative" }}>
              <button 
                style={styles.headerIconBtn} 
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                title="View recent alerts"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div style={styles.notificationBadge}>5</div>
              </button>
              
              {showNotificationPopup && (
                <div style={styles.notificationDropdown} className="glass-panel">
                  <div style={styles.notificationDropHeader}>
                    <strong>Recent Notifications</strong>
                  </div>
                  <div style={styles.notificationDropItem}>
                    <span style={{ color: "var(--danger-red)", marginRight: "6px" }}>●</span>
                    <strong>iFlow Payment_Integration failed</strong>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>Error in mapping step · 01:08 PM</div>
                  </div>
                  <div style={styles.notificationDropItem}>
                    <span style={{ color: "var(--secondary-orange)", marginRight: "6px" }}>●</span>
                    <strong>High latency detected</strong>
                    <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>iFlow Order_Processing · 12:45 PM</div>
                  </div>
                </div>
              )}
            </div>

            {/* HELP ICON */}
            <button style={styles.headerIconBtn} title="Help Documentation">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </button>

            {/* USER PROFILE BUBBLE */}
            <div style={{ position: "relative" }}>
              <div style={styles.avatar}>
                <span>AD</span>
              </div>
              <div style={styles.avatarStatusDot} />
            </div>

          </div>
        </header>

        {/* 📦 PAGE CONTENT PANEL */}
        <main style={styles.contentContainer}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

/* ================= SLEEK PLACEHOLDER FOR OTHER MODULES ================= */
const AdvancedModulePlaceholder = ({ tabName, setTab }) => (
  <div style={placeholderStyles.container}>
    <div style={placeholderStyles.card} className="glass-panel hover-scale">
      <div style={placeholderStyles.glowingBadge}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-float">
          <polygon points="12 2 2 7 12 12 22 7 12 2 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
        <span>INTEGROVAX CORRELATION SYSTEM</span>
      </div>

      <h2 style={placeholderStyles.title}>Module: {tabName}</h2>
      
      <p style={placeholderStyles.description}>
        This enterprise module is currently active, fully secure, and continuously optimized in the background by the **IntegrovaX AI Copilot**.
      </p>

      <div style={placeholderStyles.aiBox}>
        <div style={placeholderStyles.pulseDot} />
        <span style={placeholderStyles.aiText}>AI Engine State: Live Correlation & Predictive Sync</span>
      </div>

      <button style={placeholderStyles.backBtn} onClick={() => setTab("Overview")} className="hover-scale">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Return to Dashboard Overview
      </button>
    </div>
  </div>
);

/* ================= STYLES ================= */
const styles = {
  app: {
    display: "flex",
    background: "#F8FAFC",
    minHeight: "100vh",
    width: "100vw",
    overflow: "hidden"
  },

  mainContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100vh"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 40px",
    height: "76px",
    background: "rgba(255, 255, 255, 0.8)", // Glassmorphism backdrop
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(226, 232, 240, 0.7)",
    zIndex: 90
  },

  searchContainer: {
    display: "flex",
    alignItems: "center",
    width: "400px", // Increased width
    height: "40px",  // Slightly higher
    background: "rgba(241, 245, 249, 0.8)",
    borderRadius: "10px",
    border: "1px solid rgba(226, 232, 240, 0.8)",
    position: "relative",
    marginLeft: "10px"
  },

  searchInput: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "0 12px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#1E293B",
    outline: "none",
    "::placeholder": {
      color: "#94A3B8"
    }
  },

  shortcutBadge: {
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: "5px",
    padding: "2px 6px",
    marginRight: "10px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px"
  },

  envSelectorWrapper: {
    position: "relative"
  },

  envButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(0, 200, 83, 0.08)", // Modernized green background
    border: "1px solid rgba(0, 200, 83, 0.2)",
    borderRadius: "20px",
    padding: "6px 16px",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
  },

  envIndicator: {
    color: "#00C853",
    fontSize: "8px",
    marginRight: "2px"
  },

  headerIconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "6px",
    borderRadius: "8px",
    transition: "background 0.2s ease",
    ":hover": {
      background: "#F1F5F9"
    }
  },

  notificationBadge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    background: "var(--primary-blue)",
    color: "white",
    fontSize: "9px",
    fontWeight: "700",
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  notificationDropdown: {
    position: "absolute",
    right: 0,
    top: "35px",
    width: "280px",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    zIndex: 200,
    border: "1px solid #E2E8F0"
  },

  notificationDropHeader: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1E293B",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "8px",
    marginBottom: "8px"
  },

  notificationDropItem: {
    padding: "8px 4px",
    fontSize: "12px",
    color: "#334155",
    borderBottom: "1px solid #F8FAFC",
    ":last-child": {
      borderBottom: "none"
    }
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-blue)",
    color: "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 2px 8px rgba(10, 132, 255, 0.2)"
  },

  avatarStatusDot: {
    position: "absolute",
    bottom: "0px",
    right: "0px",
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    backgroundColor: "var(--success-green)",
    border: "2px solid #FFFFFF",
    boxShadow: "0 0 4px var(--success-green)"
  },

  contentContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "32px",
    background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)"
  }
};

const placeholderStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "75vh",
    width: "100%"
  },

  card: {
    maxWidth: "500px",
    width: "100%",
    borderRadius: "16px",
    padding: "40px 32px",
    textAlign: "center",
    boxShadow: "var(--card-shadow)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },

  glowingBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "rgba(111, 66, 255, 0.08)",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent-purple)",
    marginBottom: "24px"
  },

  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: "12px"
  },

  description: {
    fontSize: "14px",
    color: "#64748B",
    lineHeight: "1.6",
    marginBottom: "24px"
  },

  aiBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    padding: "10px 18px",
    borderRadius: "10px",
    marginBottom: "28px"
  },

  pulseDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--success-green)",
    boxShadow: "0 0 8px var(--success-green)",
    animation: "typing 2s infinite" // simple pulse indicator
  },

  aiText: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#475569"
  },

  backBtn: {
    backgroundColor: "var(--primary-blue)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "10px 20px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(10, 132, 255, 0.25)"
  }
};