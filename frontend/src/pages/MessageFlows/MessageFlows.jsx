import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExportPanel from "../../components/export/ExportPanel";
import GeminiChatBot from "../../components/ai/GeminiChatBot";

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:40005/sap";
const AI_BASE_URL = process.env.REACT_APP_AI_BASE_URL || "http://localhost:40005/ai";

const ERROR_CATEGORIES = [
  { id: "ALL", label: "All error types" },
  { id: "TIMEOUT", label: "Timeout" },
  { id: "MAPPING", label: "Mapping / XSD" },
  { id: "AUTH", label: "Auth / Credentials" },
  { id: "OTHER", label: "Other failures" }
];

const DATE_RANGES = [
  { id: "ALL", label: "All time" },
  { id: "TODAY", label: "Today" },
  { id: "LAST_7", label: "Last 7 days" }
];

function parseLogDate(logStart) {
  if (!logStart) return null;
  const d = new Date(logStart);
  return Number.isNaN(d.getTime()) ? null : d;
}

function matchDateRange(log, range) {
  if (range === "ALL") return true;
  const d = parseLogDate(log.logStart);
  if (!d) return true;
  const now = new Date();
  if (range === "TODAY") return d.toDateString() === now.toDateString();
  if (range === "LAST_7") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }
  return true;
}

function classifyError(log) {
  if (log.status !== "FAILED") return null;
  const text = `${log.errorText || ""} ${log.statusText || ""}`.toLowerCase();
  if (/timeout|timed out|time-out|read timed out|connection timed/i.test(text)) return "TIMEOUT";
  if (/auth|unauthorized|401|403|credential|oauth|certificate|forbidden|invalid token/i.test(text)) return "AUTH";
  if (/mapping|xslt|xpath|transform|schema|xsd|payload|parse|xml|json/i.test(text)) return "MAPPING";
  return "OTHER";
}

const MOCK_FLOWS = [
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
    errorText: "HTTP parent connection timed out after 30000ms. Remote service endpoint at https://api.successfactors.com/odata/v2/User is unreachable."
  },
  {
    messageGuid: "MSG-0E9E8A1B-327B-89CE-18B5-B5D14B85",
    correlationId: "CORR-6f371a3c-112039",
    flowName: "Ariba_PurchaseOrder_Router",
    status: "COMPLETED",
    logStart: new Date(Date.now() - 14400000).toISOString(),
    logEnd: new Date(Date.now() - 14399000).toISOString(),
    errorText: ""
  },
  {
    messageGuid: "MSG-FAFE8DF1-2864-4592-ABD9-D6E3DA82",
    correlationId: "CORR-5e462d4d-009182",
    flowName: "ERP_to_SuccessFactors_EmployeeMap",
    status: "FAILED",
    logStart: new Date(Date.now() - 28800000).toISOString(),
    logEnd: new Date(Date.now() - 28798000).toISOString(),
    errorText: "XSLT Stylesheet compilation error: element <HireDate> in the XML schema mismatch."
  },
  {
    messageGuid: "MSG-8A859E35-2B64-4592-ABD9-D6E3DA82",
    correlationId: "CORR-4d573e5e-998817",
    flowName: "Inventory_Update_Listener",
    status: "COMPLETED",
    logStart: new Date(Date.now() - 43200000).toISOString(),
    logEnd: new Date(Date.now() - 43196000).toISOString(),
    errorText: ""
  },
  {
    messageGuid: "MSG-9753D6FB-CCD7-4AF1-92BB-928B7F8F",
    correlationId: "CORR-3c684f6f-223344",
    flowName: "BTP_Log_Exporter",
    status: "FAILED",
    logStart: new Date(Date.now() - 86400000).toISOString(),
    logEnd: new Date(Date.now() - 86399000).toISOString(),
    errorText: "Authentication Failure: 401 Unauthorized client credentials for OAuth2 server context."
  }
];

export default function MessageFlows() {
  const [logs, setLogs] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [filters, setFilters] = useState({
    status: "ALL",
    flow: "ALL",
    search: "",
    dateRange: "ALL",
    errorCategory: "ALL"
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState({ open: false, content: "", loading: false, guid: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/logs`);
        const serverLogs = res.data?.data || [];
        setLogs(serverLogs);
        localStorage.setItem("integrovax_logs", JSON.stringify(serverLogs));
        setLastRefresh(new Date());
      } catch (err) {
        console.warn("Backend unavailable, loading local storage logs fallback...", err.message);
        const saved = localStorage.getItem("integrovax_logs");
        if (saved) {
          setLogs(JSON.parse(saved));
        } else {
          localStorage.setItem("integrovax_logs", JSON.stringify(MOCK_FLOWS));
          setLogs(MOCK_FLOWS);
        }
        setLastRefresh(new Date());
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const flows = useMemo(
    () => [...new Set(logs.map((l) => l.flowName).filter(Boolean))],
    [logs]
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchStatus = filters.status === "ALL" || l.status === filters.status;
      const matchFlow = filters.flow === "ALL" || l.flowName === filters.flow;
      const matchSearch = (l.messageGuid || "")
        .toLowerCase()
        .includes(filters.search.toLowerCase());
      const matchDate = matchDateRange(l, filters.dateRange);
      const category = classifyError(l);
      const matchError =
        filters.errorCategory === "ALL" ||
        (filters.errorCategory === "OTHER" && category === "OTHER") ||
        category === filters.errorCategory;
      return matchStatus && matchFlow && matchSearch && matchDate && matchError;
    });
  }, [logs, filters]);

  const errorBreakdown = useMemo(() => {
    const failed = filteredLogs.filter((l) => l.status === "FAILED");
    const counts = { TIMEOUT: 0, MAPPING: 0, AUTH: 0, OTHER: 0 };
    failed.forEach((l) => {
      const cat = classifyError(l) || "OTHER";
      counts[cat] += 1;
    });
    return counts;
  }, [filteredLogs]);

  const kpi = useMemo(() => {
    const total = filteredLogs.length;
    const completed = filteredLogs.filter((l) => l.status === "COMPLETED").length;
    const failed = filteredLogs.filter((l) => l.status === "FAILED").length;
    const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";
    return { total, completed, failed, rate };
  }, [filteredLogs]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const exportFilteredExcel = () => {
    const rows = filteredLogs.map((l) => ({
      "Flow Name": l.flowName,
      Status: l.status,
      "Error Category": classifyError(l) || "-",
      "Message GUID": l.messageGuid,
      "Correlation ID": l.correlationId || "",
      "Log Start": l.logStart,
      "Log End": l.logEnd || "",
      "Error Text": l.errorText || ""
    }));
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Info: "No rows match current filters" }]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Filtered Flows");
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `SAP_CPI_Filtered_${Date.now()}.xlsx`);
  };

  const exportMultiSheetExcel = () => {
    const workbook = XLSX.utils.book_new();
    const totalMessages = logs.length;
    const completedCount = logs.filter((l) => l.status === "COMPLETED").length;
    const failedCount = logs.filter((l) => l.status === "FAILED").length;
    const successRate = totalMessages > 0 ? `${((completedCount / totalMessages) * 100).toFixed(2)}%` : "0%";

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { Metric: "Total Messages", Value: totalMessages },
        { Metric: "Completed", Value: completedCount },
        { Metric: "Failed", Value: failedCount },
        { Metric: "Success Rate", Value: successRate },
        { Metric: "Export Time", Value: new Date().toISOString() }
      ]),
      "KPI Summary"
    );

    const errorLogs = filteredLogs
      .filter((l) => l.status === "FAILED")
      .map((l) => ({
        "Message GUID": l.messageGuid,
        Category: classifyError(l),
        "Integration Flow": l.flowName,
        Timestamp: l.logStart,
        "Error Reason": l.errorText || "No error text on record"
      }));
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        errorLogs.length ? errorLogs : [{ Message: "No failures in filtered scope." }]
      ),
      "Error Analysis"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        filteredLogs.map((l) => ({
          "Flow Name": l.flowName,
          Status: l.status,
          "Message GUID": l.messageGuid,
          Time: l.logStart
        }))
      ),
      "Filtered Flows"
    );

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `SAP_CPI_AuditReport_${Date.now()}.xlsx`);
  };

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const sapBlue = [10, 110, 209];
    doc.setFillColor(...sapBlue);
    doc.rect(0, 0, 210, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("SAP Cloud Integration — Message Flow Report", 14, 16);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Filtered records: ${filteredLogs.length}`, 14, 37);

    doc.autoTable({
      startY: 44,
      head: [["Flow", "Status", "GUID", "Time"]],
      body: filteredLogs.map((l) => [l.flowName, l.status, l.messageGuid, l.logStart]),
      theme: "striped",
      headStyles: { fillColor: sapBlue },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          data.cell.styles.textColor = data.cell.raw === "FAILED" ? [211, 47, 47] : [46, 125, 50];
        }
      }
    });
    doc.save(`SAP_MessageFlows_${Date.now()}.pdf`);
  };

  const analyzeFailureWithAI = async (log) => {
    setAiAnalysis({ open: true, content: "", loading: true, guid: log.messageGuid });
    try {
      const response = await axios.post(`${AI_BASE_URL}/analyze-failure`, { log });
      setAiAnalysis((prev) => ({ ...prev, loading: false, content: response.data.analysis }));
    } catch {
      setTimeout(() => {
        const cat = classifyError(log);
        setAiAnalysis((prev) => ({
          ...prev,
          loading: false,
          content: `Root cause hint (${cat || "UNKNOWN"}):\n\nFlow "${log.flowName}" failed at ${log.logStart}.\n\n${log.errorText || "No error text returned from CPI. Check MPL attachments and adapter trace in tenant."}\n\nSuggested checks:\n• Mapping/XSD alignment for payload structure\n• Receiver credentials and certificate expiry\n• Timeout settings on HTTP/SOAP adapters`
        }));
      }, 800);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.title}>Message Flows</h2>
          <p style={styles.subtitle}>
            Live MPL view — filter by status, flow, date, error type, or GUID
            {lastRefresh && (
              <span style={styles.liveDot}> · refreshed {lastRefresh.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div style={styles.kpiStrip}>
          <KpiChip label="Showing" value={kpi.total} />
          <KpiChip label="Completed" value={kpi.completed} color="#2e7d32" />
          <KpiChip label="Failed" value={kpi.failed} color="#d32f2f" />
          <KpiChip label="Success %" value={`${kpi.rate}%`} color="#0a6ed1" />
        </div>
      </div>

      <ExportPanel
        onExportExcel={exportMultiSheetExcel}
        onExportPdf={exportToPdf}
        dataSummary={{
          total: logs.length,
          failed: logs.filter((l) => l.status === "FAILED").length,
          filteredCount: filteredLogs.length
        }}
      />

      <div style={styles.filterBar}>
        <select style={styles.input} value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
          <option value="ALL">All status</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Failed</option>
        </select>

        <select style={styles.input} value={filters.flow} onChange={(e) => updateFilter("flow", e.target.value)}>
          <option value="ALL">All flows</option>
          {flows.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <select style={styles.input} value={filters.dateRange} onChange={(e) => updateFilter("dateRange", e.target.value)}>
          {DATE_RANGES.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>

        <select
          style={styles.input}
          value={filters.errorCategory}
          onChange={(e) => updateFilter("errorCategory", e.target.value)}
        >
          {ERROR_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        <input
          style={{ ...styles.input, flex: 1, minWidth: 200 }}
          placeholder="Search message GUID..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />

        <button type="button" style={styles.exportQuick} onClick={exportFilteredExcel}>
          Export filtered
        </button>
      </div>

      {kpi.failed > 0 && (
        <div style={styles.errorChips}>
          <span style={styles.chipsLabel}>Failed breakdown:</span>
          {Object.entries(errorBreakdown).map(([key, count]) =>
            count > 0 ? (
              <button
                key={key}
                type="button"
                style={{
                  ...styles.chip,
                  ...(filters.errorCategory === key ? styles.chipActive : {})
                }}
                onClick={() => updateFilter("errorCategory", filters.errorCategory === key ? "ALL" : key)}
              >
                {key}: {count}
              </button>
            ) : null
          )}
        </div>
      )}

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Flow name</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Message GUID</th>
              <th style={styles.th}>Time</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} style={styles.empty}>
                  No messages match the current filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l, i) => (
                <tr
                  key={l.messageGuid || i}
                  style={{
                    ...(i % 2 === 0 ? styles.trEven : styles.trOdd),
                    ...(selectedLog?.messageGuid === l.messageGuid ? styles.trSelected : {}),
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedLog(l)}
                >
                  <td style={styles.td}>{l.flowName}</td>
                  <td style={{ ...styles.td, color: l.status === "FAILED" ? "#d32f2f" : "#2e7d32", fontWeight: 600 }}>
                    {l.status}
                  </td>
                  <td style={styles.td}>
                    {classifyError(l) ? (
                      <span style={styles.categoryBadge}>{classifyError(l)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ ...styles.td, fontFamily: "monospace", fontSize: 12 }}>{l.messageGuid}</td>
                  <td style={styles.td}>{l.logStart}</td>
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    {l.status === "FAILED" ? (
                      <button type="button" onClick={() => analyzeFailureWithAI(l)} style={styles.aiButton}>
                        Explain error
                      </button>
                    ) : (
                      <span style={{ color: "#aaa", fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div style={styles.drawerOverlay} onClick={() => setSelectedLog(null)}>
          <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3 style={{ margin: 0 }}>Message detail</h3>
              <button type="button" style={styles.closeButton} onClick={() => setSelectedLog(null)}>Close</button>
            </div>
            <DetailRow label="Flow" value={selectedLog.flowName} />
            <DetailRow label="Status" value={selectedLog.status} highlight={selectedLog.status === "FAILED"} />
            <DetailRow label="Message GUID" value={selectedLog.messageGuid} mono />
            <DetailRow label="Correlation ID" value={selectedLog.correlationId || "—"} mono />
            <DetailRow label="Log start" value={selectedLog.logStart} />
            <DetailRow label="Log end" value={selectedLog.logEnd || "—"} />
            {selectedLog.status === "FAILED" && (
              <>
                <DetailRow label="Error category" value={classifyError(selectedLog) || "OTHER"} />
                <div style={styles.errorBlock}>
                  <strong>Error text</strong>
                  <pre style={styles.errorPre}>{selectedLog.errorText || "No error text on this record."}</pre>
                </div>
                <button type="button" style={styles.aiButton} onClick={() => analyzeFailureWithAI(selectedLog)}>
                  Explain error with AI
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {aiAnalysis.open && (
        <div style={styles.modalOverlay} onClick={() => setAiAnalysis((p) => ({ ...p, open: false }))}>
          <div style={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, color: "#0a6ed1" }}>AI Root Cause Analysis</h3>
              <button type="button" style={styles.modalCloseIcon} onClick={() => setAiAnalysis((p) => ({ ...p, open: false }))}>✕</button>
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 12px" }}>GUID: {aiAnalysis.guid}</p>
            <hr style={{ borderColor: "#f1f5f9", margin: "0 0 12px" }} />
            
            <div style={styles.modalContentScroll}>
              {aiAnalysis.loading ? (
                <div style={styles.loadingSpinner}>Analyzing log context…</div>
              ) : (
                <div style={styles.aiContent}>{aiAnalysis.content}</div>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <button type="button" style={styles.closeButton} onClick={() => setAiAnalysis((p) => ({ ...p, open: false }))}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <GeminiChatBot
        currentLogsSummary={{
          total: logs.length,
          failed: logs.filter((l) => l.status === "FAILED").length
        }}
      />
    </div>
  );
}

function KpiChip({ label, value, color }) {
  return (
    <div style={styles.kpiChip}>
      <span style={styles.kpiLabel}>{label}</span>
      <span style={{ ...styles.kpiValue, color: color || "#24292e" }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span
        style={{
          ...styles.detailValue,
          ...(mono ? { fontFamily: "monospace", fontSize: 12 } : {}),
          ...(highlight ? { color: "#d32f2f", fontWeight: 600 } : {})
        }}
      >
        {value}
      </span>
    </div>
  );
}

const styles = {
  container: {
    padding: 24,
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: "#f5f6f7",
    minHeight: "100vh"
  },
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 16
  },
  title: { margin: 0, color: "#32363a", fontSize: 22 },
  subtitle: { margin: "6px 0 0", color: "#6a6d70", fontSize: 13 },
  liveDot: { color: "#2e7d32" },
  kpiStrip: { display: "flex", gap: 8, flexWrap: "wrap" },
  kpiChip: {
    background: "#fff",
    border: "1px solid #e1e4e8",
    borderRadius: 6,
    padding: "8px 12px",
    minWidth: 72,
    textAlign: "center"
  },
  kpiLabel: { display: "block", fontSize: 11, color: "#6a6d70" },
  kpiValue: { display: "block", fontSize: 18, fontWeight: 700 },
  filterBar: {
    display: "flex",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
    alignItems: "center",
    background: "#fff",
    padding: 14,
    borderRadius: 8,
    border: "1px solid #e1e4e8"
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #c4c9d0",
    borderRadius: 6,
    fontSize: 14,
    background: "#fff",
    minWidth: 140
  },
  exportQuick: {
    padding: "9px 14px",
    background: "#107c41",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13
  },
  errorChips: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap"
  },
  chipsLabel: { fontSize: 12, color: "#6a6d70", fontWeight: 500 },
  chip: {
    padding: "4px 10px",
    borderRadius: 12,
    border: "1px solid #e1e4e8",
    background: "#fff",
    fontSize: 12,
    cursor: "pointer"
  },
  chipActive: { background: "#0a6ed1", color: "#fff", borderColor: "#0a6ed1" },
  tableWrap: {
    background: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    border: "1px solid #e1e4e8",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thRow: { background: "#0a6ed1" },
  th: { color: "#fff", padding: "12px 16px", fontWeight: 600, fontSize: 13, textAlign: "left" },
  td: { padding: "11px 16px", borderBottom: "1px solid #eef2f5", fontSize: 14, color: "#333" },
  trEven: { background: "#fff" },
  trOdd: { background: "#fafbfc" },
  trSelected: { background: "#e8f4fd !important" },
  categoryBadge: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 4,
    background: "#fff3e0",
    color: "#e65100",
    fontWeight: 600
  },
  empty: { padding: 32, textAlign: "center", color: "#6a6d70" },
  aiButton: {
    padding: "6px 12px",
    background: "#6f42c1",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 12
  },
  drawerOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 900,
    display: "flex",
    justifyContent: "flex-end"
  },
  drawer: {
    width: 420,
    maxWidth: "92vw",
    height: "100%",
    background: "#fff",
    padding: 24,
    overflowY: "auto",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.12)"
  },
  drawerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "2px solid #0a6ed1"
  },
  detailRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 8,
    marginBottom: 10,
    fontSize: 13
  },
  detailLabel: { color: "#6a6d70", fontWeight: 500 },
  detailValue: { color: "#32363a", wordBreak: "break-all" },
  errorBlock: { marginTop: 12 },
  errorPre: {
    marginTop: 8,
    padding: 12,
    background: "#fff5f5",
    border: "1px solid #ffcdd2",
    borderRadius: 6,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    maxHeight: 200,
    overflow: "auto"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000
  },
  modalBox: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    width: 600,
    maxWidth: "92vw",
    maxHeight: "85vh",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid #e2e8f0"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  modalCloseIcon: {
    background: "none",
    border: "none",
    fontSize: 18,
    color: "#64748b",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    width: 28,
    height: 28,
    transition: "background 0.2s"
  },
  modalContentScroll: {
    flex: 1,
    overflowY: "auto",
    margin: "8px 0",
    paddingRight: 6
  },
  loadingSpinner: {
    padding: 40,
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600"
  },
  aiContent: {
    whiteSpace: "pre-line",
    fontSize: 13.5,
    lineHeight: 1.6,
    color: "#0f172a",
    background: "#f8fafc",
    padding: 16,
    borderRadius: 8,
    border: "1px solid #e2e8f0"
  },
  modalFooter: {
    textAlign: "right",
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #f1f5f9"
  },
  closeButton: {
    padding: "8px 18px",
    background: "#0a6ed1",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: "600",
    fontSize: 13,
    boxShadow: "0 2px 4px rgba(10, 110, 209, 0.2)"
  }
};
