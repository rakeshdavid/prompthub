import { makeAssistantToolUI } from "@assistant-ui/react";
import { Table2 } from "lucide-react";

interface Column {
  key: string;
  label: string;
}

interface DataTableArgs {
  title: string;
  columns: Column[];
  rows: Array<Record<string, unknown>>;
}

type DataTableResult = string;

function DataTableContent({ args }: { args: DataTableArgs }) {
  const { title, columns, rows } = args;

  return (
    <div className="my-2 rounded-lg border border-border border-l-[3px] border-l-maslow-teal bg-background overflow-hidden">
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-foreground/60 mt-0.5">
          {rows.length} {rows.length === 1 ? "row" : "rows"}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-2 text-left font-semibold text-foreground/70"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-border/50 last:border-0 hover:bg-[#EBF7F4]/30 dark:hover:bg-[#EBF7F4]/10 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-foreground">
                    {String(row[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const DataTableToolUI = makeAssistantToolUI<
  DataTableArgs,
  DataTableResult
>({
  toolName: "show_data_table",
  render: ({ result, status }) => {
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <Table2 size={14} className="animate-pulse text-maslow-teal" />
          <span>Loading data table...</span>
        </div>
      );
    }

    if (!result) return null;

    try {
      const args: DataTableArgs =
        typeof result === "string" ? JSON.parse(result) : result;
      return <DataTableContent args={args} />;
    } catch {
      return null;
    }
  },
});
