import type { OperationalStatus } from "../types";
import { OPERATIONAL_STATUS_LABELS } from "../types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<OperationalStatus, string> = {
  available: "bg-[#097870]/10 text-[#097870] border-[#097870]/20",
  rented: "bg-[#097870]/10 text-[#097870] border-[#097870]/20",
  reserved: "bg-amber-100 text-amber-700 border-amber-200",
  maintenance: "bg-amber-100 text-amber-700 border-amber-200",
  broken: "bg-red-100 text-red-700 border-red-200",
  accident: "bg-red-100 text-red-700 border-red-200",
  retired: "bg-gray-100 text-gray-600 border-gray-200",
};

type StatusBadgeProps = {
  status: OperationalStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(STATUS_COLORS[status], className)}>
      {OPERATIONAL_STATUS_LABELS[status]}
    </Badge>
  );
}
