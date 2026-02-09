import {
  getDepartmentColor,
  getDepartmentTextColor,
} from "../constants/departments";

interface DepartmentBadgeProps {
  department: string;
  className?: string;
}

export function DepartmentBadge({
  department,
  className = "",
}: DepartmentBadgeProps) {
  const bgColor = getDepartmentColor(department);
  const textColor = getDepartmentTextColor(department);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {department}
    </span>
  );
}
