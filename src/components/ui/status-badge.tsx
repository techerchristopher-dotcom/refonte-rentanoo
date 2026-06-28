import { cn } from "@/lib/utils";
import { BookingStatus, PaymentStatus, VehicleStatus, KycStatus } from "@/types";
import { Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StatusBadgeProps {
  status: BookingStatus | PaymentStatus | VehicleStatus | KycStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const { t, i18n } = useTranslation(); // defaultNS = "translation"
  
  const statusConfig = {
    // Booking statuses — tokens Rentanoo
    pending: {
      color: "bg-amber-100 text-amber-700",
      label: t('bookings.status.pending'),
      icon: Clock
    },
    pending_payment: {
      color: "bg-amber-100 text-amber-700",
      label: t('bookings.status.pending_payment'),
      icon: Clock
    },
    confirmed: {
      color: "bg-[#097870]/10 text-[#097870]",
      label: t('bookings.status.confirmed')
    },
    accepted: {
      color: "bg-[#097870]/10 text-[#097870]",
      label: t('bookings.status.accepted')
    },
    declined: {
      color: "bg-red-100 text-red-700",
      label: t('bookings.status.declined')
    },
    rejected: {
      color: "bg-red-100 text-red-700",
      label: t('bookings.status.rejected')
    },
    cancelled: {
      color: "bg-gray-100 text-gray-600",
      label: t('bookings.status.cancelled')
    },
    active: {
      color: "bg-[#097870]/10 text-[#097870]",
      label: t('bookings.status.active')
    },
    completed: {
      color: "bg-gray-100 text-gray-600",
      label: t('bookings.status.completed')
    },
    terminated: {
      color: "bg-gray-100 text-gray-600",
      label: t('bookings.status.terminated')
    },
    closed: {
      color: "bg-gray-100 text-gray-600",
      label: t('bookings.status.closed')
    },
  
  // Payment statuses
  requires_action: { 
    color: "bg-warning text-warning-foreground", 
    label: "Action requise" 
  },
  processing: { 
    color: "bg-warning text-warning-foreground", 
    label: "Traitement" 
  },
  succeeded: { 
    color: "bg-success text-success-foreground", 
    label: "Réussi" 
  },
  failed: { 
    color: "bg-destructive text-destructive-foreground", 
    label: "Échoué" 
  },
  refunded: { 
    color: "bg-muted text-muted-foreground", 
    label: "Remboursé" 
  },
  
  // Vehicle statuses
  draft: { 
    color: "bg-muted text-muted-foreground", 
    label: "Brouillon" 
  },
  published: { 
    color: "bg-success text-success-foreground", 
    label: "Publié" 
  },
  suspended: { 
    color: "bg-destructive text-destructive-foreground", 
    label: "Suspendu" 
  },
  vehicle_active: { 
    color: "bg-green-500 text-white", 
    label: "Actif" 
  },
  inactive: { 
    color: "bg-red-500 text-white", 
    label: "Inactif" 
  },
  
  // KYC statuses
  verified: { 
    color: "bg-success text-success-foreground", 
    label: "Vérifié" 
  },
  rejected: { 
    color: "bg-destructive text-destructive-foreground", 
    label: "Rejeté" 
  }
};

  const sizeConfig = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm", 
    lg: "px-4 py-2 text-base"
  };
  
  // DEV-only: Diagnostic des statuts et clés i18n
  if (import.meta.env.DEV) {
    const statusKeyMap: Record<string, string> = {
      pending: 'bookings.status.pending',
      pending_payment: 'bookings.status.pending_payment',
      accepted: 'bookings.status.accepted',
      declined: 'bookings.status.declined',
      cancelled: 'bookings.status.cancelled',
      active: 'bookings.status.active',
      closed: 'bookings.status.closed',
      confirmed: 'bookings.status.confirmed',
      completed: 'bookings.status.completed',
      terminated: 'bookings.status.terminated',
      rejected: 'bookings.status.rejected',
    }
    
    const candidateKey = statusKeyMap[status] || `bookings.status.${status}`
    const config = statusConfig[status as keyof typeof statusConfig]
    const labelUsed = config?.label || 'N/A'
    
    // eslint-disable-next-line no-console
    console.info('[statusbadge-i18n-diag]', {
      status_received: status,
      status_type: typeof status,
      i18n_language: i18n.language,
      i18n_resolvedLanguage: i18n.resolvedLanguage,
      defaultNS: i18n.options.defaultNS,
      candidate_key: candidateKey,
      key_exists: i18n.exists(candidateKey),
      t_result: t(candidateKey),
      t_en: t(candidateKey, { lng: 'en' }),
      t_fr: t(candidateKey, { lng: 'fr' }),
      isRawKey: t(candidateKey) === candidateKey,
      hasConfig: !!config,
      label_used: typeof labelUsed === 'string' ? labelUsed : 'function/i18n',
      label_is_i18n: typeof labelUsed === 'function' || (typeof labelUsed === 'string' && labelUsed.startsWith('bookings.')),
    })
  }
  
  const config = statusConfig[status];
  
  if (!config) {
    // Fallback robuste : utiliser "pending" comme fallback au lieu d'afficher {status} brut
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[StatusBadge] Status inconnu:', status, 'Type:', typeof status)
    }
    return (
      <span className={cn(
        "inline-flex items-center rounded-full font-medium",
        "bg-muted text-muted-foreground",
        sizeConfig[size],
        className
      )}>
        {t('bookings.status.pending')}
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium transition-colors",
      config.color,
      sizeConfig[size],
      className
    )}>
      {config.icon && <config.icon className="h-3 w-3 mr-1" />}
      {config.label}
    </span>
  );
}