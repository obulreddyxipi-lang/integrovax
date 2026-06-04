import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

const AI_BASE_URL = process.env.REACT_APP_AI_BASE_URL || "http://localhost:40005/ai";
const SAP_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:40005/sap";

export default function GeminiChatBot({ currentLogsSummary, allLogs = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Track the last processed error GUID to prevent resetting the conversation history
  const [lastAlertedGuid, setLastAlertedGuid] = useState("");
  const chatBodyRef = useRef(null);

  // ================= DYNAMIC INITIALIZATION & PROACTIVE ALERTS =================
  useEffect(() => {
    const failedLogs = allLogs.filter((l) => l.status === "FAILED");
    
    if (failedLogs.length > 0) {
      const recentFailure = failedLogs[failedLogs.length - 1];
      
      // ONLY push a new message if this specific failure hasn't been flagged yet
      if (recentFailure.messageGuid !== lastAlertedGuid) {
        setLastAlertedGuid(recentFailure.messageGuid);
        setMessages((prev) => [
          ...prev,
          {
            sender: "ai",
            kind: "text",
            text: `🚨 **Live Alert: Fault Detected in Pipeline!**\n\nIntegration flow **"${recentFailure.flowName}"** has failed.\n\n**Message GUID:** \`${recentFailure.messageGuid}\`\n**Timestamp:** ${recentFailure.logStart}\n\nType **"analyze"** to check structural XSD designs and credential pathways for this log trace.`
          }
        ]);
      }
    } else if (messages.length === 0) {
      // Default welcome message only if the chat conversation pipeline is completely empty
      setMessages([
        {
          sender: "ai",
          kind: "text",
          text: "Hello! I am your SAP CPI Copilot. All message flows are currently healthy and operating within nominal parameters. How can I assist you today?"
        }
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLogs.length, isOpen]);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isOpen]);

  const pushAiText = (text) => setMessages((prev) => [...prev, { sender: "ai", kind: "text", text }]);

  const pushAiIflow = ({ spec, zip, cpiRequestBody }) =>
    setMessages((prev) => [
      ...prev,
      { sender: "ai", kind: "iflow", spec, zip, cpiRequestBody }
    ]);

  const downloadIflowZip = ({ iflowId, artifactContentBase64 }) => {
    const bytes = Uint8Array.from(atob(artifactContentBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/zip" });
    saveAs(blob, `${iflowId}.zip`);
  };

  const deployIflowToCpi = async ({ iflowId, iflowName, packageId, artifactContentBase64 }) => {
    const res = await axios.post(`${SAP_BASE_URL}/iflows/create`, {
      iflowId,
      iflowName,
      packageId,
      artifactContentBase64,
    });
    return res.data;
  };

  // ================= DYNAMIC MESSAGE HANDLING =================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", kind: "text", text: userMessage }]);
    setInput("");
    setLoading(true);

    // Pull current system parameters dynamically at the exact millisecond the user clicks send
    const failedLogs = allLogs.filter((l) => l.status === "FAILED");
    const targetLog = failedLogs[failedLogs.length - 1];

    try {
      // Local command: create iflow <requirements...>
      if (/^\s*create\s+iflow\b/i.test(userMessage)) {
        try {
          const response = await axios.post(`${AI_BASE_URL}/create-iflow`, { message: userMessage });
          pushAiIflow(response.data);
          setLoading(false);
          return;
        } catch (e) {
          pushAiText(`❌ iFlow generation failed: ${e?.response?.data?.details || e?.response?.data?.error || e.message}`);
          setLoading(false);
          return;
        }
      }

      const response = await axios.post(`${AI_BASE_URL}/copilot-chat`, {
        message: userMessage,
        context: currentLogsSummary,
        latestFailure: targetLog,
        filteredPoolSize: allLogs.length
      });
      pushAiText(response.data.reply);
    } catch (err) {
      // Dynamic fallback calculation block matching custom keywords
      setTimeout(() => {
        let fallbackReply = `I am tracking your integration space. Currently monitoring ${allLogs.length} total active payloads across cluster channels. Please specify a transaction parameter to dissect.`;

        if (
          userMessage.toLowerCase().includes("analyze") ||
          userMessage.toLowerCase().includes("error") ||
          userMessage.toLowerCase().includes("why")
        ) {
          if (targetLog) {
            fallbackReply = `📊 **Dynamic Diagnostics for Transaction:** \`${targetLog.messageGuid}\`\n\n**Component integration block:** ${targetLog.flowName}\n**Trace Stamp:** ${targetLog.logStart}\n**Error Log:** ${targetLog.errorText || "XML payload structural transformation failure."}\n\n**Remediation Steps:**\n1. Ensure source properties match target XSD layout paths.\n2. Confirm endpoint validation setups and keystore credentials match receiver policies.`;
          } else {
            fallbackReply = `✨ I examined all ${allLogs.length} messages in the pool buffer. No active processing exceptions or runtime faults were caught. System health is optimal.`;
          }
        } else if (userMessage.toLowerCase().includes("status") || userMessage.toLowerCase().includes("health") || userMessage.toLowerCase().includes("summary")) {
          const total = currentLogsSummary.total;
          const failed = currentLogsSummary.failed;
          const successRate = total > 0 ? (((total - failed) / total) * 100).toFixed(2) : "100.00";
          
          fallbackReply = `📊 **Real-time System Status Context Map:**\n\n- **Total Monitored Traffic:** ${total} payloads\n- **Successful Transmissions:** ${total - failed}\n- **Failed Transmissions:** ${failed}\n- **Calculated success rate:** ${successRate}%`;
        }

        pushAiText(fallbackReply);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.floatingContainer}>
      {!isOpen && (
        <button style={styles.fab} onClick={() => setIsOpen(true)}>
          ✨ Copilot {currentLogsSummary.failed > 0 && <span style={styles.alertDot}>{currentLogsSummary.failed}</span>}
        </button>
      )}

      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>🔮</span>
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>Gemini Assistant</div>
                <div style={{ fontSize: "10px", color: "#a5d8ff" }}>Connected to Live Logs</div>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div ref={chatBodyRef} style={styles.messageArea}>
            {messages.map((msg, i) => (
              <div key={i} style={msg.sender === "user" ? styles.userRow : styles.aiRow}>
                {msg.kind === "iflow" ? (
                  <div style={styles.aiBubble}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>iFlow package generated</div>
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      <div><strong>ID:</strong> <span style={{ fontFamily: "monospace" }}>{msg.zip?.iflowId}</span></div>
                      <div><strong>Name:</strong> {msg.zip?.iflowName}</div>
                      <div style={{ marginTop: 6, color: "#555" }}>{msg.spec?.description || ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        style={styles.actionBtn}
                        onClick={() => downloadIflowZip({ iflowId: msg.zip.iflowId, artifactContentBase64: msg.zip.artifactContentBase64 })}
                      >
                        Download ZIP
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.actionBtn, background: "#0a6ed1" }}
                        onClick={async () => {
                          const pkg = window.prompt("Enter CPI PackageId to create the design-time artifact in CPI:");
                          if (!pkg) return;
                          try {
                            await deployIflowToCpi({
                              iflowId: msg.zip.iflowId,
                              iflowName: msg.zip.iflowName,
                              packageId: pkg,
                              artifactContentBase64: msg.zip.artifactContentBase64,
                            });
                            pushAiText(`✅ Created design-time artifact in CPI package "${pkg}". (Deploy step can be done in CPI UI.)`);
                          } catch (e) {
                            pushAiText(`❌ CPI create failed: ${e?.response?.data?.error || e.message}`);
                          }
                        }}
                      >
                        Create in CPI (needs PackageId)
                      </button>
                    </div>
                    {msg.cpiRequestBody && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, color: "#555", fontWeight: 600, marginBottom: 6 }}>
                          MCP-style CPI request payload
                        </div>
                        <pre style={styles.preJson}>
                          {JSON.stringify(msg.cpiRequestBody, null, 2)}
                        </pre>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "#666", marginTop: 10 }}>
                      Files: {(msg.zip?.files || []).join(", ")}
                    </div>
                  </div>
                ) : (
                  <div style={msg.sender === "user" ? styles.userBubble : styles.aiBubble}>
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div style={styles.aiRow}>
                <div style={{ ...styles.aiBubble, color: "#888", fontStyle: "italic" }}>
                  Parsing live runtime traces...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} style={styles.inputForm}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type 'analyze', 'status', or 'create iflow <your requirement>'..."
              style={styles.chatInput}
              disabled={loading}
            />
            <button type="submit" style={styles.sendBtn} disabled={loading}>
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  floatingContainer: { position: "fixed", bottom: "24px", right: "24px", zIndex: 2000, fontFamily: "'Segoe UI', system-ui, sans-serif" },
  fab: { position: "relative", background: "linear-gradient(135deg, #6f42c1 0%, #0a6ed1 100%)", color: "#fff", border: "none", borderRadius: "50px", padding: "14px 24px", fontWeight: "600", fontSize: "14px", cursor: "pointer", boxShadow: "0 8px 24px rgba(111, 66, 193, 0.35)", display: "flex", alignItems: "center", gap: "6px" },
  alertDot: { background: "#d32f2f", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", marginLeft: "4px", fontWeight: "700" },
  chatWindow: { width: "380px", height: "480px", background: "#ffffff", borderRadius: "12px", boxShadow: "0 12px 36px rgba(0,0,0,0.15)", border: "1px solid #e1e6eb", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { background: "#0a6ed1", color: "#ffffff", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  closeBtn: { background: "none", border: "none", color: "#fff", fontSize: "16px", cursor: "pointer", opacity: "0.8" },
  messageArea: { flex: 1, padding: "16px", overflowY: "auto", background: "#f8f9fa", display: "flex", flexDirection: "column", gap: "12px" },
  userRow: { display: "flex", justifyContent: "flex-end" },
  aiRow: { display: "flex", justifyContent: "flex-start" },
  userBubble: { background: "#0a6ed1", color: "#fff", padding: "10px 14px", borderRadius: "14px 14px 2px 14px", maxWidth: "80%", fontSize: "13px", lineHeight: "1.4" },
  aiBubble: { background: "#fff", color: "#24292e", padding: "10px 14px", borderRadius: "14px 14px 14px 2px", maxWidth: "80%", fontSize: "13px", lineHeight: "1.4", border: "1px solid #e1e6eb", whiteSpace: "pre-line" },
  inputForm: { display: "flex", borderTop: "1px solid #e1e6eb", padding: "10px", background: "#fff" },
  chatInput: { flex: 1, border: "1px solid #c4c9d0", borderRadius: "20px", padding: "8px 16px", fontSize: "13px", outline: "none" },
  sendBtn: { background: "#0a6ed1", color: "#fff", border: "none", borderRadius: "50%", width: "32px", height: "32px", marginLeft: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  actionBtn: { background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, padding: "8px 10px", cursor: "pointer", fontWeight: 700, fontSize: 12 },
  preJson: {
    margin: 0,
    padding: 12,
    background: "#0b1220",
    color: "#d1e8ff",
    borderRadius: 8,
    fontSize: 11,
    lineHeight: 1.35,
    maxHeight: 220,
    overflow: "auto",
    border: "1px solid rgba(255,255,255,0.08)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  }
};
