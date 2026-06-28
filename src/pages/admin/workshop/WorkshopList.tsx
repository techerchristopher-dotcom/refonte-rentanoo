import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/ui/page-loader";
import { formatMoney } from "@/features/back-office/components/MoneyInput";
import { useRepairs } from "@/features/back-office/hooks/useRepairs";
import { INTERVENTION_TYPE_LABELS, REPAIR_STATUS_LABELS, type RepairStatus } from "@/features/back-office/types";
import { useState } from "react";

export default function WorkshopList() {
  const [status, setStatus] = useState<RepairStatus | "all">("all");
  const { data: repairs, isLoading } = useRepairs({ status });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Atelier — Réparations</h1>
          <p className="text-sm text-muted-foreground">{repairs?.length ?? 0} intervention(s)</p>
        </div>
        <Button asChild className="bg-[#E8622F] hover:bg-[#E8622F]/90 text-white">
          <Link to="/admin/workshop/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle intervention
          </Link>
        </Button>
      </div>

      <Select value={status} onValueChange={(v) => setStatus(v as RepairStatus | "all")}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          {(Object.keys(REPAIR_STATUS_LABELS) as RepairStatus[]).map((s) => (
            <SelectItem key={s} value={s}>
              {REPAIR_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F4F2EE] border-b border-[#D8D5CF]">
                <TableHead className="font-display text-sm">Date</TableHead>
                <TableHead className="font-display text-sm">Scooter</TableHead>
                <TableHead className="font-display text-sm">Type</TableHead>
                <TableHead className="font-display text-sm">Titre</TableHead>
                <TableHead className="font-display text-sm">Statut</TableHead>
                <TableHead className="font-display text-sm">Coût</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(repairs ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune réparation
                  </TableCell>
                </TableRow>
              ) : (
                repairs!.map((r: {
                  id: string;
                  opened_at: string;
                  intervention_type: string;
                  title: string;
                  status: string;
                  total_cost: number;
                  vehicles: { internal_code: string | null; brand: string; model: string } | null;
                }) => (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.opened_at).toLocaleDateString("fr-FR")}</TableCell>
                    <TableCell>
                      {(r.vehicles?.internal_code ?? `${r.vehicles?.brand ?? ""} ${r.vehicles?.model ?? ""}`.trim()) || "—"}
                    </TableCell>
                    <TableCell>{INTERVENTION_TYPE_LABELS[r.intervention_type as keyof typeof INTERVENTION_TYPE_LABELS] ?? r.intervention_type}</TableCell>
                    <TableCell>
                      <Link to={`/admin/workshop/${r.id}`} className="text-[#097870] hover:text-[#097870]/80">
                        {r.title}
                      </Link>
                    </TableCell>
                    <TableCell>{REPAIR_STATUS_LABELS[r.status as keyof typeof REPAIR_STATUS_LABELS] ?? r.status}</TableCell>
                    <TableCell>{formatMoney(r.total_cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
