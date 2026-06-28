import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/ui/page-loader";
import { formatMoney } from "@/features/back-office/components/MoneyInput";
import { useSales } from "@/features/back-office/hooks/useSales";

const PAYMENT_LABELS = { unpaid: "Impayé", partial: "Partiel", paid: "Payé" };

export default function SalesList() {
  const { data: sales, isLoading } = useSales();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display">Ventes comptoir</h1>
          <p className="text-sm text-muted-foreground">Pièces vendues aux clients</p>
        </div>
        <Button asChild className="bg-[#E8622F] hover:bg-[#E8622F]/90 text-white">
          <Link to="/admin/sales/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle vente
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F4F2EE] border-b border-[#D8D5CF]">
                <TableHead className="font-display text-sm">Date</TableHead>
                <TableHead className="font-display text-sm">Client</TableHead>
                <TableHead className="font-display text-sm">Total</TableHead>
                <TableHead className="font-display text-sm">Marge</TableHead>
                <TableHead className="font-display text-sm">Paiement</TableHead>
                <TableHead className="text-right font-display text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(sales ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune vente
                  </TableCell>
                </TableRow>
              ) : (
                sales!.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.sale_date).toLocaleString("fr-FR")}</TableCell>
                    <TableCell>{s.customer_name ?? s.customer_id?.slice(0, 8) ?? "Comptoir"}</TableCell>
                    <TableCell>{formatMoney(s.total_amount)}</TableCell>
                    <TableCell>{formatMoney(s.margin_total)}</TableCell>
                    <TableCell>{PAYMENT_LABELS[s.payment_status]}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/sales/${s.id}`}>Voir</Link>
                      </Button>
                    </TableCell>
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
