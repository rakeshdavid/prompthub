export const DEPARTMENTS = [
  { name: "Marketing", color: "#EE7BB3" },
  { name: "Legal", color: "#401877" },
  { name: "R&D", color: "#6DC4AD" },
  { name: "HR", color: "#A070A6" },
  { name: "Finance", color: "#F3A326" },
  { name: "Executive", color: "#121D35" },
  { name: "Sales", color: "#E19379" },
  { name: "IT", color: "#469DBB" },
  { name: "Data", color: "#60C3AE" },
  { name: "Customer Experience", color: "#DA85B2" },
  { name: "Supply Chain", color: "#EBA93D" },
] as const;

export type Department = (typeof DEPARTMENTS)[number]["name"];

export function getDepartmentColor(department: string): string {
  const dept = DEPARTMENTS.find((d) => d.name === department);
  return dept?.color ?? "#A5A5A5";
}

export function getDepartmentTextColor(department: string): string {
  const darkTextDepts = [
    "R&D",
    "Data",
    "Supply Chain",
    "Sales",
    "Finance",
    "Customer Experience",
  ];
  return darkTextDepts.includes(department) ? "#333333" : "#FFFFFF";
}
