// CSV Export Utility

interface ExportColumn {
  key: string;
  header: string;
  format?: (value: any) => string;
}

export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
) => {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Create header row
  const headers = columns.map((col) => col.header);
  
  // Create data rows
  const rows = data.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      const formatted = col.format ? col.format(value) : value;
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(formatted ?? "");
      if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  // Combine headers and rows
  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportRCIRegionsToCSV = (
  regions: Array<{
    region_code: string;
    region_name: string;
    rci_score: number;
    rci_trend: string | null;
    land_capacity: number | null;
    ocean_capacity: number | null;
    human_capacity: number | null;
    circular_capacity: number | null;
    last_updated: string | null;
  }>
) => {
  const columns: ExportColumn[] = [
    { key: "region_code", header: "Region Code" },
    { key: "region_name", header: "Region Name" },
    { key: "rci_score", header: "RCI Score", format: (v) => v?.toFixed(2) ?? "" },
    { key: "rci_trend", header: "Trend" },
    { key: "land_capacity", header: "Land Capacity", format: (v) => v?.toFixed(2) ?? "" },
    { key: "ocean_capacity", header: "Ocean Capacity", format: (v) => v?.toFixed(2) ?? "" },
    { key: "human_capacity", header: "Human Capacity", format: (v) => v?.toFixed(2) ?? "" },
    { key: "circular_capacity", header: "Circular Capacity", format: (v) => v?.toFixed(2) ?? "" },
    { key: "last_updated", header: "Last Updated", format: (v) => v ? new Date(v).toLocaleDateString() : "" },
  ];

  exportToCSV(regions, columns, "rci_regions_export");
};

export const exportUserRolesToCSV = (
  userRoles: Array<{
    user_id: string;
    role: string;
    created_at: string;
  }>
) => {
  const columns: ExportColumn[] = [
    { key: "user_id", header: "User ID" },
    { key: "role", header: "Role" },
    { key: "created_at", header: "Created At", format: (v) => v ? new Date(v).toLocaleDateString() : "" },
  ];

  exportToCSV(userRoles, columns, "user_roles_export");
};

export const exportAnalyticsToCSV = (
  data: Array<Record<string, any>>,
  filename: string = "analytics_export"
) => {
  if (data.length === 0) return;
  
  // Auto-generate columns from first item
  const columns: ExportColumn[] = Object.keys(data[0]).map((key) => ({
    key,
    header: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  exportToCSV(data, columns, filename);
};
