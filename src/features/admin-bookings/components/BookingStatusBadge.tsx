import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  pending_payment: {
    label: "En attente de paiement",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  confirmed: {
    label: "Confirmée",
    className: "bg-[#097870]/10 text-[#097870] border-[#097870]/20",
  },
  active: {
    label: "En cours",
    className: "bg-[#097870]/10 text-[#097870] border-[#097870]/20",
  },
  accepted: {
    label: "Acceptée",
    className: "bg-[#097870]/10 text-[#097870] border-[#097870]/20",
  },
  completed: {
    label: "Terminée",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  terminated: {
    label: "Résiliée",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

type BookingStatusBadgeProps = {
  status: string;
  className?: string;
};

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
