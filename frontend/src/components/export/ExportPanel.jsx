import React from "react";

export default function ExportPanel({ onExportExcel, onExportPdf, dataSummary }) {
  return (
    <div style={styles.panelContainer}>
      {/* Metrics Badges */}
      <div style={styles.metricsGroup}>
        <div style={styles.badge}>
          <span style={styles.badgeLabel}>Total Traces:</span>
          <span style={styles.badgeValue}>{dataSummary.total}</span>
        </div>
        <div style={{ ...styles.badge, borderColor: "#fbe4e4" }}>
          <span style={{ ...styles.badgeLabel, color: "#d32f2f" }}>Failed Processes:</span>
          <span style={{ ...styles.badgeValue, color: "#d32f2f", background: "#fbe4e4" }}>
            {dataSummary.failed}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={styles.buttonGroup}>
        <button onClick={onExportExcel} style={styles.excelButton}>
          📊 Export Multi-Sheet Excel
        </button>
        <button onClick={onExportPdf} style={styles.pdfButton}>
          📄 Export SAP PDF Report
        </button>
      </div>
    </div>
  );
}

const styles = {
  panelContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#ffffff",
    padding: "16px 20px",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)",
    border: "1px solid #e1e4e8",
    flexWrap: "wrap",
    gap: "15px"
  },
  metricsGroup: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  badge: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #e1e4e8",
    borderRadius: "6px",
    overflow: "hidden",
    fontSize: "13px",
    fontFamily: "Segoe UI, sans-serif"
  },
  badgeLabel: {
    padding: "6px 10px",
    background: "#f6f8fa",
    color: "#586069",
    fontWeight: "500"
  },
  badgeValue: {
    padding: "6px 12px",
    background: "#fff",
    color: "#24292e",
    fontWeight: "600"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  excelButton: {
    padding: "8px 14px",
    background: "#107c41",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center"
  },
  pdfButton: {
    padding: "8px 14px",
    background: "#0a6ed1",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
    display: "flex",
    alignItems: "center"
  }
};