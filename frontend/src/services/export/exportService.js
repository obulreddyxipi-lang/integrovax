import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";

// ================= KPI =================
const buildKPI = (logs) => {
  const total = logs.length;
  const success = logs.filter(l => l.status === "COMPLETED").length;
  const failed = logs.filter(l => l.status === "FAILED").length;
  const processing = total - success - failed;

  return [
    { KPI: "Total Messages", Value: total },
    { KPI: "Success", Value: success },
    { KPI: "Failed", Value: failed },
    { KPI: "Processing", Value: processing }
  ];
};

// ================= EXCEL EXPORT =================
export const exportExcel = (logs, mode = "FILTERED") => {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(buildKPI(logs)),
    "KPI"
  );

  const flows = logs.map(l => ({
    Flow: l.flowName,
    Status: l.status,
    GUID: l.messageGuid,
    Time: l.logStart
  }));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(flows),
    "Flows"
  );

  const errors = logs
    .filter(l => l.status === "FAILED")
    .map(l => ({
      Flow: l.flowName,
      GUID: l.messageGuid,
      Error: "Integration Failure"
    }));

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(errors),
    "Errors"
  );

  const buffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array"
  });

  const blob = new Blob([buffer], {
    type: "application/octet-stream"
  });

  saveAs(blob, `CPI_${mode}_Export_${Date.now()}.xlsx`);
};

// ================= PDF EXPORT =================
export const exportPDF = (logs) => {
  const doc = new jsPDF();

  doc.text("SAP CPI Audit Report", 14, 10);

  const rows = logs.map(l => [
    l.flowName,
    l.status,
    l.messageGuid,
    l.logStart
  ]);

  doc.autoTable({
    head: [["Flow", "Status", "GUID", "Time"]],
    body: rows
  });

  doc.save(`CPI_Audit_${Date.now()}.pdf`);
};

// ================= EMAIL =================
export const sendEmailReport = (logs) => {
  console.log("Email report triggered", logs.length);
  alert("Email sent (mock)");
};

// ================= AI =================
export const explainReport = (logs) => {
  const total = logs.length;
  const failed = logs.filter(l => l.status === "FAILED").length;
  const success = logs.filter(l => l.status === "COMPLETED").length;

  return `
CPI REPORT ANALYSIS:

Total: ${total}
Success: ${success}
Failed: ${failed}

Status: ${failed > 0 ? "Issues detected" : "Healthy system"}
`;
};