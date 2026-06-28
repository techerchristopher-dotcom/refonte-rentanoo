import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageLoader } from "@/components/ui/page-loader";
import { formatMoney } from "@/features/back-office/components/MoneyInput";
import { useReportsSummary } from "@/features/back-office/hooks/useReports";

export default function ReportsDashboard() {
  const { data: summary, isLoading } = useReportsSummary();

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Rapports & indicateurs</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de l'activité atelier et stock</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-[#097870]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scooters disponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {summary?.scootersAvailable ?? 0}
            <span className="text-sm font-normal text-muted-foreground"> / {summary?.scootersTotal ?? 0}</span>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#E8622F]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">En panne / maintenance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-[#E8622F]">{summary?.scootersInMaintenance ?? 0}</CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#E8622F]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stock bas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">{summary?.lowStockCount ?? 0}</CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#097870]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Coût réparations (30j)</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatMoney(summary?.repairsCostLast30Days)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valeur du stock</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-bold">{formatMoney(summary?.stockValue)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ventes pièces (mois en cours)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatMoney(summary?.salesThisMonth)}</p>
            <p className="text-sm text-muted-foreground">Marge: {formatMoney(summary?.salesMarginThisMonth)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scooters les plus coûteux (30j)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F4F2EE] border-b border-[#D8D5CF]">
                <TableHead className="font-display text-sm">Scooter</TableHead>
                <TableHead className="font-display text-sm">Coût réparations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(summary?.topCostlyScooters ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                    Aucune donnée
                  </TableCell>
                </TableRow>
              ) : (
                summary!.topCostlyScooters.map((s) => (
                  <TableRow key={s.vehicle_id}>
                    <TableCell>
                      <Link to={`/admin/fleet/${s.vehicle_id}`} className="text-[#097870] hover:text-[#097870]/80">
                        {s.label}
                      </Link>
                    </TableCell>
                    <TableCell>{formatMoney(s.total_cost)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pièces les plus utilisées (interne)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableBody>
                {(summary?.topUsedParts ?? []).map((p) => (
                  <TableRow key={p.part_id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{p.total_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pièces les plus vendues (mois)</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableBody>
                {(summary?.topSoldParts ?? []).map((p) => (
                  <TableRow key={p.part_id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-right">{p.total_qty}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
