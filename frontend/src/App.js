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
  const [env, setEnv] = useState("RUNTIME");
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const getFormattedTime = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const defaultNotifications = [
    { id: 1, type: "error", title: "iFlow Payment_Integration failed", desc: "Error in mapping step", time: "01:08 PM", unread: true },
    { id: 2, type: "warning", title: "High latency detected", desc: "iFlow Order_Processing latency > 1500ms", time: "12:45 PM", unread: true },
    { id: 3, type: "success", title: "Deployment successful", desc: "iFlow Employee_Sync deployed", time: "10:30 AM", unread: true },
    { id: 4, type: "info", title: "Environment Switch", desc: "Production tenant connected", time: "09:15 AM", unread: false },
    { id: 5, type: "error", title: "System Health Alert", desc: "Memory utilization exceeds 85%", time: "Yesterday", unread: true }
  ];

  // Dynamic Notifications State (loaded from localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("integrovax_notifications");
    return saved ? JSON.parse(saved) : defaultNotifications;
  });

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, unread: !n.unread } : n));
  };

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Sync to localStorage
  React.useEffect(() => {
    localStorage.setItem("integrovax_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Listen to custom integration notification triggers
  React.useEffect(() => {
    const handleNewNotifEvent = (e) => {
      if (e.detail && e.detail.title) {
        const newNotif = {
          id: Date.now() + Math.random(),
          type: e.detail.type || "info",
          title: e.detail.title,
          desc: e.detail.desc || "",
          time: getFormattedTime(),
          unread: true
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    };
    window.addEventListener("integrovax-new-notification", handleNewNotifEvent);
    return () => window.removeEventListener("integrovax-new-notification", handleNewNotifEvent);
  }, []);

  // Background BTP Alert simulation loop
  React.useEffect(() => {
    const alerts = [
      { type: "error", title: "iFlow Salesforce_Sync failed", desc: "Connection timed out after 30000ms" },
      { type: "warning", title: "API Rate Limit Warning", desc: "Client ERP_SYSTEM reached 90% of hourly limit" },
      { type: "success", title: "iFlow Inventory_Update success", desc: "Processed 1,420 messages in 12s" },
      { type: "info", title: "Certificate Auto-Renewed", desc: "SSL certificate renewed successfully" },
      { type: "error", title: "Database connection failed", desc: "BTP Postgres database unavailable" },
      { type: "warning", title: "High CPU utilization", desc: "Worker Node 3 CPU utilization exceeds 90%" },
      { type: "success", title: "Deploy complete: Customer_Master", desc: "Active routing model version 2.1.4 is live" },
      { type: "info", title: "Keystore updated", desc: "New public key imported for partner ERP_VENDOR" }
    ];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
        const newNotif = {
          id: Date.now() + Math.random(),
          type: randomAlert.type,
          title: randomAlert.title,
          desc: randomAlert.desc,
          time: getFormattedTime(),
          unread: true
        };
        setNotifications(prev => [newNotif, ...prev]);
      }
    }, 45000);
    
    return () => clearInterval(interval);
  }, []);

  // Environment & Credentials Manager State
  const defaultEnvs = [
    { name: "RUNTIME", baseUrl: "http://localhost:40005/sap", authType: "none" },
    { name: "PRODUCTION", baseUrl: "https://tenant-prod.itg.cfapps.eu10.hana.ondemand.com", authType: "none" },
    { name: "STAGE", baseUrl: "https://tenant-stage.itg.cfapps.eu10.hana.ondemand.com", authType: "none" },
    { name: "DEVELOPMENT", baseUrl: "https://tenant-dev.itg.cfapps.eu10.hana.ondemand.com", authType: "none" }
  ];

  const [customEnvs, setCustomEnvs] = useState(() => {
    const saved = localStorage.getItem("integrovax_custom_environments");
    let list = saved ? JSON.parse(saved) : defaultEnvs;
    if (!list.some(e => e.name === "RUNTIME")) {
      list = [{ name: "RUNTIME", baseUrl: "http://localhost:40005/sap", authType: "none" }, ...list];
      localStorage.setItem("integrovax_custom_environments", JSON.stringify(list));
    }
    return list;
  });

  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);

  // Form State for Adding New Environment
  const [newEnvName, setNewEnvName] = useState("");
  const [newEnvUrl, setNewEnvUrl] = useState("");
  const [newEnvAuthType, setNewEnvAuthType] = useState("none");
  const [newEnvUsername, setNewEnvUsername] = useState("");
  const [newEnvPassword, setNewEnvPassword] = useState("");
  const [newEnvClientId, setNewEnvClientId] = useState("");
  const [newEnvClientSecret, setNewEnvClientSecret] = useState("");
  const [newEnvTokenUrl, setNewEnvTokenUrl] = useState("");
  const [newEnvApiKeyName, setNewEnvApiKeyName] = useState("apiKey");
  const [newEnvApiKeyValue, setNewEnvApiKeyValue] = useState("");
  const [newEnvApiKeyLocation, setNewEnvApiKeyLocation] = useState("header");

  const saveEnvironments = (updatedList) => {
    setCustomEnvs(updatedList);
    localStorage.setItem("integrovax_custom_environments", JSON.stringify(updatedList));
  };

  const handleAddEnv = (e) => {
    e.preventDefault();
    if (!newEnvName.trim() || !newEnvUrl.trim()) {
      alert("Name and URL are required.");
      return;
    }
    if (customEnvs.some(item => item.name.toUpperCase() === newEnvName.trim().toUpperCase())) {
      alert("An environment with this name already exists.");
      return;
    }

    const newEnv = {
      name: newEnvName.trim().toUpperCase(),
      baseUrl: newEnvUrl.trim(),
      authType: newEnvAuthType,
      username: newEnvUsername,
      password: newEnvPassword,
      clientId: newEnvClientId,
      clientSecret: newEnvClientSecret,
      tokenUrl: newEnvTokenUrl,
      apiKeyName: newEnvApiKeyName,
      apiKeyValue: newEnvApiKeyValue,
      apiKeyLocation: newEnvApiKeyLocation
    };

    const nextList = [...customEnvs, newEnv];
    saveEnvironments(nextList);
    
    // Add dynamic notification
    const newNotif = {
      id: Date.now() + Math.random(),
      type: "success",
      title: "Environment Configured",
      desc: `Environment "${newEnvName.trim().toUpperCase()}" created and saved`,
      time: getFormattedTime(),
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Reset Form
    setNewEnvName("");
    setNewEnvUrl("");
    setNewEnvAuthType("none");
    setNewEnvUsername("");
    setNewEnvPassword("");
    setNewEnvClientId("");
    setNewEnvClientSecret("");
    setNewEnvTokenUrl("");
    setNewEnvApiKeyName("apiKey");
    setNewEnvApiKeyValue("");
    setNewEnvApiKeyLocation("header");
  };

  const handleDeleteEnv = (nameToDelete) => {
    if (nameToDelete === "RUNTIME" || nameToDelete === "PRODUCTION" || nameToDelete === "STAGE" || nameToDelete === "DEVELOPMENT") {
      alert("System default environments cannot be deleted.");
      return;
    }
    const nextList = customEnvs.filter(item => item.name !== nameToDelete);
    saveEnvironments(nextList);
    if (env === nameToDelete) {
      setEnv("PRODUCTION");
    }

    // Add dynamic notification
    const newNotif = {
      id: Date.now() + Math.random(),
      type: "warning",
      title: "Environment Removed",
      desc: `Environment "${nameToDelete}" was deleted`,
      time: getFormattedTime(),
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

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
        return <Simulators activeEnvName={env} customEnvironments={customEnvs} />;
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
              <button style={styles.envButton} onClick={() => setShowEnvDropdown(!showEnvDropdown)}>
                <span style={styles.envIndicator}>●</span>
                <span style={{ fontWeight: "600", fontSize: "12px", color: "#1E293B" }}>{env}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showEnvDropdown && (
                <div style={styles.envDropdown} className="glass-panel">
                  <div style={styles.envDropdownHeader}>Select Environment</div>
                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {customEnvs.map((e, idx) => (
                      <div 
                        key={idx} 
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: env === e.name ? "rgba(0, 200, 83, 0.08)" : "transparent",
                          transition: "all 0.15s ease",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          marginBottom: "4px"
                        }}
                        onMouseOver={(event) => { if (env !== e.name) event.currentTarget.style.background = "#F1F5F9"; }}
                        onMouseOut={(event) => { if (env !== e.name) event.currentTarget.style.background = "transparent"; }}
                        onClick={() => {
                          setEnv(e.name);
                          setShowEnvDropdown(false);
                          const newNotif = {
                            id: Date.now() + Math.random(),
                            type: "info",
                            title: "Environment Switch",
                            desc: `Connected to ${e.name} environment`,
                            time: getFormattedTime(),
                            unread: true
                          };
                          setNotifications(prev => [newNotif, ...prev]);
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: e.name === "PRODUCTION" ? "#00C853" : "#0A84FF", fontSize: "8px" }}>●</span>
                          <strong style={{ fontSize: "12px", color: "#1E293B" }}>{e.name}</strong>
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.baseUrl}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "1px", background: "#E2E8F0", margin: "6px 0" }} />
                  <button 
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: "8px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#0A84FF",
                      cursor: "pointer",
                      borderRadius: "8px",
                      textAlign: "center",
                      transition: "background 0.2s ease"
                    }}
                    onMouseOver={(event) => { event.currentTarget.style.background = "#F1F5F9"; }}
                    onMouseOut={(event) => { event.currentTarget.style.background = "transparent"; }}
                    onClick={() => { setShowEnvModal(true); setShowEnvDropdown(false); }}
                  >
                    ⚙️ Manage Environments
                  </button>
                </div>
              )}
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
                {unreadCount > 0 && <div style={styles.notificationBadge}>{unreadCount}</div>}
              </button>
              
              {showNotificationPopup && (
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "42px",
                  width: "320px",
                  borderRadius: "14px",
                  padding: "12px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                  zIndex: 200,
                  border: "1px solid #E2E8F0",
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(12px)"
                }} className="glass-panel">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "13px", color: "#1E293B" }}>Recent Notifications</strong>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearAllNotifications} 
                        style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: "16px 8px", textAlign: "center", color: "#64748B", fontSize: "12px" }}>
                      No notifications found.
                    </div>
                  ) : (
                    <div style={{ maxHeight: "240px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotificationClick(n.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "8px",
                            background: n.unread ? "rgba(10, 132, 255, 0.03)" : "transparent",
                            border: `1px solid ${n.unread ? "rgba(10, 132, 255, 0.08)" : "transparent"}`,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "8px"
                          }}
                          onMouseOver={(event) => { event.currentTarget.style.background = "#F1F5F9"; }}
                          onMouseOut={(event) => { event.currentTarget.style.background = n.unread ? "rgba(10, 132, 255, 0.03)" : "transparent"; }}
                        >
                          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", overflow: "hidden" }}>
                            <span style={{ 
                              color: n.type === "error" ? "#EF4444" : n.type === "warning" ? "#F59E0B" : n.type === "success" ? "#10B981" : "#3B82F6", 
                              fontSize: "8px",
                              marginTop: "4px"
                            }}>●</span>
                            <div style={{ overflow: "hidden" }}>
                              <div style={{ fontSize: "12px", fontWeight: "600", color: "#1E293B", opacity: n.unread ? 1 : 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {n.title}
                              </div>
                              <div style={{ fontSize: "11px", color: "#64748B", marginTop: "2px" }}>
                                {n.desc}
                              </div>
                              <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>
                                {n.time}
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => deleteNotification(e, n.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#94A3B8",
                              cursor: "pointer",
                              fontSize: "12px",
                              padding: "2px",
                              flexShrink: 0
                            }}
                            onMouseOver={(event) => { event.currentTarget.style.color = "#EF4444"; }}
                            onMouseOut={(event) => { event.currentTarget.style.color = "#94A3B8"; }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {unreadCount > 0 && (
                    <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: "8px", marginTop: "8px", display: "flex", justifyContent: "center" }}>
                      <button 
                        onClick={markAllAsRead}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#0A84FF",
                          fontSize: "11px",
                          fontWeight: "600",
                          cursor: "pointer",
                          width: "100%",
                          textAlign: "center"
                        }}
                      >
                        ✓ Mark all as read
                      </button>
                    </div>
                  )}
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

      {/* ⚙️ ENVIRONMENT MANAGER MODAL */}
      {showEnvModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            background: "rgba(255, 255, 255, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            width: "100%",
            maxWidth: "760px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "24px",
            color: "#1E293B",
            fontFamily: "'Inter', sans-serif"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "16px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#021B45" }}>⚙️ Manage Simulation Environments</h3>
              <button 
                onClick={() => setShowEnvModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer", color: "#64748B" }}
              >✕</button>
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              {/* Left Column: Environments List */}
              <div style={{ flex: 1, minWidth: "280px", borderRight: "1px solid #F1F5F9", paddingRight: "20px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "12px" }}>Active Environments</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {customEnvs.map((e, idx) => (
                    <div 
                      key={idx} 
                      style={{
                        padding: "10px 12px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div style={{ overflow: "hidden", marginRight: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "#00C853", fontSize: "6px" }}>●</span>
                          <strong style={{ fontSize: "12px" }}>{e.name}</strong>
                          {e.authType !== "none" && (
                            <span style={{ fontSize: "9px", background: "#E0F2FE", color: "#0369A1", padding: "1px 4px", borderRadius: "4px", fontWeight: "600" }}>
                              🔑 {e.authType.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.baseUrl}</div>
                      </div>
                      {e.name !== "PRODUCTION" && e.name !== "STAGE" && e.name !== "DEVELOPMENT" && (
                        <button 
                          onClick={() => handleDeleteEnv(e.name)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#EF4444",
                            cursor: "pointer",
                            fontSize: "14px"
                          }}
                        >✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Add Environment Form */}
              <form onSubmit={handleAddEnv} style={{ flex: 1.2, minWidth: "300px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Add New Environment</span>
                
                <div>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>Environment Name *</label>
                  <input 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                    value={newEnvName}
                    onChange={(e) => setNewEnvName(e.target.value)}
                    placeholder="e.g. DEV_SANDBOX"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>Base URL *</label>
                  <input 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                    value={newEnvUrl}
                    onChange={(e) => setNewEnvUrl(e.target.value)}
                    placeholder="https://tenant-dev.itg.cfapps..."
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#475569", display: "block", marginBottom: "4px" }}>Authentication Type</label>
                  <select 
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                    value={newEnvAuthType}
                    onChange={(e) => setNewEnvAuthType(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="basic">Basic Authentication</option>
                    <option value="oauth2">OAuth 2.0 client credentials</option>
                    <option value="apikey">API Key</option>
                  </select>
                </div>

                {/* Conditional Fields based on Auth Type */}
                {newEnvAuthType === "basic" && (
                  <div style={{ display: "flex", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "4px" }}>User Name</label>
                      <input 
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                        value={newEnvUsername}
                        onChange={(e) => setNewEnvUsername(e.target.value)}
                        placeholder="admin"
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "4px" }}>Password</label>
                      <input 
                        type="password"
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "13px" }}
                        value={newEnvPassword}
                        onChange={(e) => setNewEnvPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                {newEnvAuthType === "oauth2" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>Client ID</label>
                      <input 
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                        value={newEnvClientId}
                        onChange={(e) => setNewEnvClientId(e.target.value)}
                        placeholder="sb-123xyz"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>Client Secret</label>
                      <input 
                        type="password"
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                        value={newEnvClientSecret}
                        onChange={(e) => setNewEnvClientSecret(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>Token URL</label>
                      <input 
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                        value={newEnvTokenUrl}
                        onChange={(e) => setNewEnvTokenUrl(e.target.value)}
                        placeholder="https://authentication.eu10.hana..."
                      />
                    </div>
                  </div>
                )}

                {newEnvAuthType === "apikey" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div style={{ flex: 1.2 }}>
                        <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>API Key Name</label>
                        <input 
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                          value={newEnvApiKeyName}
                          onChange={(e) => setNewEnvApiKeyName(e.target.value)}
                          placeholder="x-api-key"
                        />
                      </div>
                      <div style={{ flex: 0.8 }}>
                        <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>Location</label>
                        <select 
                          style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                          value={newEnvApiKeyLocation}
                          onChange={(e) => setNewEnvApiKeyLocation(e.target.value)}
                        >
                          <option value="header">Header</option>
                          <option value="query">Query Parameter</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", color: "#475569", display: "block", marginBottom: "2px" }}>API Key Value</label>
                      <input 
                        type="password"
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid #CBD5E1", borderRadius: "8px", fontSize: "12px" }}
                        value={newEnvApiKeyValue}
                        onChange={(e) => setNewEnvApiKeyValue(e.target.value)}
                        placeholder="apiKeyVal123"
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  style={{
                    backgroundColor: "#0A84FF",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px",
                    fontWeight: "600",
                    cursor: "pointer",
                    marginTop: "10px",
                    boxShadow: "0 2px 4px rgba(10,132,255,0.2)"
                  }}
                >
                  ➕ Add and Save Environment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
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

  envDropdown: {
    position: "absolute",
    right: 0,
    top: "42px",
    width: "240px",
    borderRadius: "12px",
    padding: "8px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    zIndex: 250,
    border: "1px solid #E2E8F0",
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(12px)"
  },

  envDropdownHeader: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    padding: "6px 8px",
    borderBottom: "1px solid #F1F5F9",
    marginBottom: "4px"
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