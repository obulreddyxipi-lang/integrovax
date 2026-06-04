/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import logoImg from "../../assets/logo.png";

export default function Sidebar({ activeTab, setTab }) {
  const [collapsed, setCollapsed] = useState(false);

  // Grouped menu structure to match the IntegrovaX mockup
  const groups = [
    {
      title: "AI COPILOT",
      items: [
        { name: "Overview", label: "Dashboard", icon: "dashboard", isDefault: true },
        { name: "AI Copilot", label: "AI Copilot", icon: "copilot", badge: "New" },
        { name: "iFlow Builder", label: "Generate iFlow", icon: "magic" },
        { name: "MCP Planner", label: "MCP Planner", icon: "planner" },
        { name: "Integration Advisor", label: "Integration Advisor", icon: "advisor" }
      ]
    },
    {
      title: "INTEGRATION MANAGEMENT",
      items: [
        { name: "Packages and iFlows", label: "Packages & iFlows", icon: "folder" },
        { name: "Message Flows", label: "Message Flows", icon: "flow" },
        { name: "Artifacts", label: "Artifacts", icon: "box" }
      ]
    },
    {
      title: "MONITORING & ANALYTICS",
      items: [
        { name: "Message Flows", label: "Message Tracking", icon: "tracking" },
        { name: "Error Analysis", label: "Error Analytics", icon: "warning" },
        { name: "System Health", label: "Health Center", icon: "heart" }
      ]
    },
    {
      title: "PERFORMANCE",
      items: [
        { name: "Performance Monitor", label: "Performance Monitor", icon: "gauge" },
        { name: "Optimize", label: "Optimize", icon: "zap" }
      ]
    },
    {
      title: "TOOLS",
      items: [
        { name: "Simulators", label: "Simulators", icon: "cpu" }
      ]
    },
    {
      title: "SETTINGS",
      items: [
        { name: "System Settings", label: "System Settings", icon: "settings" }
      ]
    }
  ];

  // Helper to render beautiful SVG icons contextually
  const getIcon = (type, active) => {
    const strokeColor = active ? "#FFFFFF" : "#94A3B8";
    const fillColor = active ? "#FFFFFF" : "none";

    switch (type) {
      case "dashboard":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case "copilot":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            <circle cx="12" cy="12" r="10" stroke={strokeColor} strokeWidth="2" fill="none" style={{ opacity: 0.15 }} />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="#FF8A00" strokeWidth="2.5" />
          </svg>
        );
      case "magic":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5 5 3Z" fill={strokeColor} style={{ opacity: 0.8 }} />
            <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" fill="#6F42FF" />
          </svg>
        );
      case "planner":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="m9 16 2 2 4-4" />
          </svg>
        );
      case "advisor":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5" />
            <path d="M9 18h6M10 22h4" />
          </svg>
        );
      case "folder":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
          </svg>
        );
      case "flow":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        );
      case "box":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      case "tracking":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <path d="M5 16v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3" />
          </svg>
        );
      case "warning":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "heart":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        );
      case "gauge":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12a10 10 0 1 1 20 0M12 18v-6" />
            <circle cx="12" cy="12" r="1" />
            <path d="m13.4 10.6 2.7-2.7" />
          </svg>
        );
      case "zap":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        );
      case "cpu":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
            <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
          </svg>
        );
      case "settings":
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        ...styles.sidebar,
        width: collapsed ? "72px" : "280px",
        minWidth: collapsed ? "72px" : "280px"
      }}
    >
      {/* 🚀 BRAND HEADER */}
      <div style={styles.brandContainer}>
        {!collapsed && (
          <div style={styles.brandDetails}>
            <div style={styles.logoRow}>
              <img src={logoImg} alt="IntegrovaX" style={styles.logoImg} />
              <span style={styles.brandText}>IntegrovaX</span>
            </div>
            <span style={styles.brandSubtext}>AI-Powered Copilot for SAP Suite</span>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            ...styles.toggleBtn,
            alignSelf: collapsed ? "center" : "flex-start",
            marginTop: collapsed ? "10px" : "5px"
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          )}
        </button>
      </div>

      {/* 📂 MENUS AND GROUPS */}
      <div style={styles.menuScrollContainer} className="no-scrollbar">
        {groups.map((group, gIdx) => (
          <div key={gIdx} style={styles.groupContainer}>
            {!collapsed && <div style={styles.groupTitle}>{group.title}</div>}
            {collapsed && <div style={styles.groupDivider} />}

            {group.items.map((item, iIdx) => {
              const isActive = activeTab === item.name;

              return (
                <div
                  key={iIdx}
                  onClick={() => setTab(item.name)}
                  style={{
                    ...styles.menuItem,
                    backgroundColor: isActive ? "var(--sidebar-active)" : "transparent",
                    color: isActive ? "#FFFFFF" : "#E2E8F0",
                    fontWeight: isActive ? "700" : "500",
                    boxShadow: isActive ? "0 0 16px rgba(10, 132, 255, 0.45)" : "none",
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "10px 0" : "11px 16px"
                  }}
                  className="hover-scale"
                  title={collapsed ? item.label : ""}
                >
                  <div style={styles.itemLeft}>
                    {getIcon(item.icon, isActive)}
                    {!collapsed && <span style={styles.menuLabel}>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge && (
                    <span style={styles.badge}>{item.badge}</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 📉 BOTTOM COLLAPSE BTN */}
      {!collapsed && (
        <div style={styles.footerToggle} onClick={() => setCollapsed(true)} className="hover-scale">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
          <span style={styles.footerToggleText}>Collapse</span>
        </div>
      )}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  sidebar: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    padding: "24px 16px",
    background: "radial-gradient(circle at 100% 0%, rgba(10, 132, 255, 0.28) 0%, transparent 65%), linear-gradient(180deg, #021B45 0%, #042C6B 100%)", // Swoosh blue logo area glow
    borderRight: "1px solid rgba(255, 255, 255, 0.08)",
    zIndex: 100,
    position: "sticky",
    top: 0,
    boxShadow: "8px 0 24px rgba(0, 0, 0, 0.25)"
  },

  brandContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "32px",
    padding: "0 6px"
  },

  brandDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  logoImg: {
    width: "30px",
    height: "30px",
    objectFit: "contain",
    borderRadius: "6px",
    boxShadow: "0 0 10px rgba(10, 132, 255, 0.3)"
  },

  brandText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: "-0.5px"
  },

  brandSubtext: {
    fontSize: "10px",
    fontWeight: "600",
    color: "#94A3B8",
    whiteSpace: "nowrap",
    opacity: 0.8
  },

  toggleBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease"
  },

  menuScrollContainer: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    paddingRight: "2px"
  },

  groupContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  groupTitle: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#475569",
    letterSpacing: "0.8px",
    paddingLeft: "16px",
    marginBottom: "8px"
  },

  groupDivider: {
    height: "1px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    margin: "12px 8px 6px 8px"
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    margin: "0 2px"
  },

  itemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  menuLabel: {
    whiteSpace: "nowrap"
  },

  badge: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#6F42FF",
    padding: "2px 8px",
    borderRadius: "20px"
  },

  footerToggle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    marginTop: "auto",
    cursor: "pointer",
    borderRadius: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.05)",
    transition: "all 0.2s ease"
  },

  footerToggleText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#94A3B8"
  }
};