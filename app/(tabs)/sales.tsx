import React, { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { ReportPeriodPicker } from "@/components/report-period-picker";
import { Badge, Card, EmptyState, Loading, Row, SectionHeader, StatTile } from "@/components/ui";
import { Text } from "@/components/ui/text";
import { usePropertyData } from "@/lib/use-property-data";
import { fetchPropertyDashboard } from "@/lib/queries";
import { formatETB, formatETBCompact, formatNumber, isLodgingType } from "@/lib/format";
import { moduleChips, propertyCapabilities } from "@/lib/modules";
import { usePortfolio } from "@/lib/portfolio";
import { useCafeReport, type CafeReportPeriod } from "@/lib/use-cafe-report";
import {
  DualTrendChart,
  GaugeRow,
  ProfitWaterfall,
  RankBars,
  SegmentedBar,
} from "@/components/ops-charts";
import type {
  ApprovalPipelineCounts,
  CafeOpsSnapshot,
  CafePeriodReport,
  ModuleHealth,
  PropertyDashboard,
} from "@/lib/types";

export default function SalesScreen() {
  const { selected } = usePortfolio();
  const { data, loading, refreshing, error, tin, refresh } =
    usePropertyData(fetchPropertyDashboard);
  const [period, setPeriod] = useState<CafeReportPeriod>("Daily");
  const [reportDate, setReportDate] = useState(() => new Date());

  const lodging = isLodgingType(selected?.businessType ?? data?.businessType);
  const caps = propertyCapabilities(data?.modules ?? selected?.modules);
  const showOpsLayout = lodging || caps.hasRooms || caps.hasCm;
  const cafeReport = useCafeReport(tin, caps.hasCafe, period, reportDate);

  const onRefresh = async () => {
    await Promise.all([refresh(), cafeReport.refresh()]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader title={showOpsLayout ? "Operations" : "Sales"} />
      {!tin ? (
        <Card className="m-4">
          <EmptyState icon="business-outline" title="No property selected" />
        </Card>
      ) : loading && !data ? (
        <Loading label={showOpsLayout ? "Loading operations…" : "Loading sales…"} />
      ) : (
        <ScrollView
          contentContainerClassName="px-4 gap-3 pb-4"
          refreshControl={
            <RefreshControl
              refreshing={refreshing || cafeReport.refreshing}
              onRefresh={onRefresh}
              tintColor="#2DD4BF"
            />
          }
        >
          {error ? <ErrorCard message={error} /> : null}
          {data ? (
            <>
              <SubscribedModulesBar modules={data.modules} />
              {caps.hasCafe ? (
                <ReportPeriodPicker
                  period={period}
                  date={reportDate}
                  onPeriodChange={(next) => {
                    setPeriod(next);
                    if (next === "Monthly") {
                      const monthStart = new Date(reportDate);
                      monthStart.setDate(1);
                      setReportDate(monthStart);
                    }
                  }}
                  onDateChange={setReportDate}
                />
              ) : null}
              {showOpsLayout ? (
                <LodgingDashboard
                  data={data}
                  cafeReport={cafeReport.data}
                  cafeReportLoading={cafeReport.loading}
                  cafeReportError={cafeReport.error}
                />
              ) : (
                <CafeDashboard
                  data={data}
                  cafeReport={cafeReport.data}
                  cafeReportLoading={cafeReport.loading}
                  cafeReportError={cafeReport.error}
                />
              )}
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SubscribedModulesBar({ modules }: { modules: string[] | null }) {
  const chips = moduleChips(modules);
  if (chips.length === 0) return null;
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {chips.map((label) => (
        <Badge
          key={label}
          label={label}
          fg="#2DD4BF"
          bg="rgba(45, 212, 191, 0.14)"
        />
      ))}
    </View>
  );
}

/* ── Cafe & Restaurant ─────────────────────────────────────────────── */

function CafeDashboard({
  data,
  cafeReport,
  cafeReportLoading,
  cafeReportError,
}: {
  data: PropertyDashboard;
  cafeReport: CafePeriodReport | null;
  cafeReportLoading: boolean;
  cafeReportError: string | null;
}) {
  const cafe = data.cafeOps;
  const caps = propertyCapabilities(data.modules);
  const ordersToday = Math.max(1, data.operational.ordersToday);

  return (
    <>
      {caps.hasCafe ? (
        <>
          {cafeReportError ? <ErrorCard message={cafeReportError} /> : null}
          {cafeReportLoading && !cafeReport ? (
            <Card>
              <Loading label="Loading café report…" />
            </Card>
          ) : cafeReport ? (
            <CafePeriodReportBlock report={cafeReport} hasCredit={caps.hasCredit} />
          ) : null}

          {cafe ? <CafeFloorCard cafe={cafe} openOrders={data.operational.openOrders} /> : null}
        </>
      ) : (
        <Card>
          <EmptyState
            icon="cafe-outline"
            title="Café module not subscribed"
            subtitle="Sales and floor metrics appear once Café & Restaurant is on this property."
          />
        </Card>
      )}

      <SectionHeader title="Operations pulse" />
      <Card>
        {caps.hasCafe ? (
          <>
            <GaugeRow
              label="Open / live orders"
              value={data.operational.openOrders}
              max={Math.max(ordersToday, data.operational.openOrders, 5)}
              tone={data.operational.openOrders > 0 ? "#FBBF24" : "#4ADE80"}
            />
            <GaugeRow
              label="Orders today"
              value={data.operational.ordersToday}
              max={Math.max(data.operational.ordersToday, 10)}
              tone="#60A5FA"
            />
            <GaugeRow
              label="Cancelled today"
              value={cafe?.cancelledToday ?? 0}
              max={Math.max(ordersToday, cafe?.cancelledToday ?? 0, 5)}
              tone={(cafe?.cancelledToday ?? 0) > 0 ? "#F87171" : "#94A3B8"}
            />
            {cafe ? (
              <>
                <GaugeRow
                  label="Menu items"
                  value={cafe.menuItemCount}
                  max={Math.max(cafe.menuItemCount, 20)}
                  tone="#F472B6"
                />
                <GaugeRow
                  label="Tables ready"
                  value={cafe.tableCount}
                  max={Math.max(cafe.tableCount, 10)}
                  tone="#A78BFA"
                />
              </>
            ) : null}
          </>
        ) : null}
        {caps.hasApprovals ? (
          <>
            <GaugeRow
              label="Pending purchases"
              value={data.operational.pendingPurchaseRequests}
              max={Math.max(data.operational.pendingPurchaseRequests, 5)}
              tone="#FBBF24"
            />
            <GaugeRow
              label="Pending stock-outs"
              value={data.operational.pendingStockOutRequests}
              max={Math.max(data.operational.pendingStockOutRequests, 5)}
              tone="#FB923C"
            />
          </>
        ) : null}
        <Row label="Active staff" value={formatNumber(data.operational.staffCount)} />
      </Card>

      {data.moduleHealth.length > 0 ? (
        <>
          <SectionHeader title="Module health" />
          {data.moduleHealth.map((m) => (
            <ModuleHealthCard key={m.module} health={m} />
          ))}
        </>
      ) : null}

      <View className="h-6" />
    </>
  );
}

function CafePeriodReportBlock({
  report,
  hasCredit,
}: {
  report: CafePeriodReport;
  hasCredit: boolean;
}) {
  const periodWord = report.period === "Monthly" ? "Month" : "Day";

  return (
    <>
      <View className="rounded-xl bg-primary p-4 gap-1">
        <Text className="text-white/85 text-[13px] font-semibold">
          {report.label} · revenue
        </Text>
        <Text className="text-white text-[30px] font-extrabold">
          {formatETB(report.revenueETB)}
        </Text>
        <Text className="text-white/85 text-xs mt-0.5">
          {formatNumber(report.paidLines)} paid lines · est. profit{" "}
          {formatETBCompact(report.profitETB)} ({report.marginPct}%)
        </Text>
      </View>

      <SectionHeader title={`Est. profit · ${report.period.toLowerCase()}`} />
      <View className="rounded-xl border border-border bg-card p-4 gap-3">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[13px] font-semibold text-muted-foreground">
              Est. profit
            </Text>
            <Text
              className="text-[28px] font-extrabold"
              style={{ color: report.profitETB >= 0 ? "#4ADE80" : "#F87171" }}
            >
              {formatETB(report.profitETB)}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] text-muted-foreground">Margin</Text>
            <Text className="text-[18px] font-extrabold text-foreground">
              {report.marginPct}%
            </Text>
          </View>
        </View>
        <ProfitWaterfall
          revenue={report.revenueETB}
          cost={report.ingredientCostETB}
          profit={report.profitETB}
        />
        <View className="flex-row gap-2 pt-1">
          <View className="flex-1 rounded-lg bg-card-alt p-2.5">
            <Text className="text-[11px] text-muted-foreground">Recipe coverage</Text>
            <Text className="text-[15px] font-extrabold text-foreground">
              {report.recipeCoveragePct}%
            </Text>
            <Text className="text-[10px] text-text-faint mt-0.5">
              {formatNumber(report.linesWithRecipe)}/{formatNumber(report.paidLines)} lines ·{" "}
              {formatNumber(report.menuItemsWithRecipe)}/{formatNumber(report.menuItemCount)} menu
            </Text>
          </View>
          <View className="flex-1 rounded-lg bg-card-alt p-2.5">
            <Text className="text-[11px] text-muted-foreground">{periodWord} sales</Text>
            <Text className="text-[15px] font-extrabold text-foreground">
              {formatETBCompact(report.revenueETB)}
            </Text>
            <Text className="text-[10px] text-text-faint mt-0.5">
              Cost {formatETBCompact(report.ingredientCostETB)}
            </Text>
          </View>
        </View>
        {report.recipeCoveragePct < 100 && report.paidLines > 0 ? (
          <Text className="text-[11px] text-warning">
            Profit uses menu recipes only — lines without a recipe contribute sales but not cost.
          </Text>
        ) : null}
      </View>

      <SectionHeader title="By payment" />
      <Card>
        <SegmentedBar
          segments={[
            { label: "Cash", value: report.cashETB, color: "#4ADE80" },
            { label: "Bank", value: report.bankETB, color: "#60A5FA" },
            {
              label: hasCredit ? "Credit" : "Other",
              value: report.creditETB,
              color: "#FBBF24",
            },
          ]}
        />
      </Card>

      {report.trend.length > 0 ? (
        <>
          <SectionHeader
            title={report.period === "Monthly" ? "Daily trend this month" : "Last 7 days"}
          />
          <Card>
            <DualTrendChart points={report.trend} />
          </Card>
        </>
      ) : null}

      <SectionHeader title="By category" />
      <Card>
        {report.categories.length === 0 ? (
          <EmptyState icon="pie-chart-outline" title="No sales in this period" />
        ) : (
          <RankBars
            rows={report.categories.map((c) => ({
              label: c.label,
              value: c.revenueETB,
              hint: `Est. profit ${formatETBCompact(c.profitETB)}`,
            }))}
            color="#2DD4BF"
          />
        )}
      </Card>

      <CafeReportInsights report={report} />
    </>
  );
}

function CafeReportInsights({ report }: { report: CafePeriodReport }) {
  const summary = report.orderSummary;
  const statusSegments = [
    { label: "Completed", value: summary.completed, color: "#4ADE80" },
    { label: "Cancelled", value: summary.cancelled, color: "#F87171" },
    { label: "Pending payment", value: summary.pendingPayment, color: "#FBBF24" },
    { label: "Expired", value: summary.expired, color: "#94A3B8" },
  ];

  return (
    <>
      <SectionHeader title={`Order status · ${report.period.toLowerCase()}`} />
      <Card className="gap-4">
        <SegmentedBar segments={statusSegments} formatValue={formatNumber} />
        <View className="flex-row gap-2">
          <OrderStatusMetric
            label="Completed"
            count={summary.completed}
            amount={summary.completedETB}
            color="#4ADE80"
          />
          <OrderStatusMetric
            label="Cancelled"
            count={summary.cancelled}
            amount={summary.cancelledETB}
            color="#F87171"
          />
        </View>
        <View className="flex-row gap-2">
          <OrderStatusMetric
            label="Pending payment"
            count={summary.pendingPayment}
            amount={summary.pendingPaymentETB}
            color="#FBBF24"
          />
          <OrderStatusMetric
            label="Expired"
            count={summary.expired}
            amount={summary.expiredETB}
            color="#94A3B8"
          />
        </View>
        <Text className="text-[11px] text-text-faint">
          {formatNumber(summary.totalLines)} order lines in {report.label}. Completed includes paid
          lines; pending payment includes completed but unpaid lines.
        </Text>
      </Card>

      <SectionHeader title={`Top 10 sold · ${report.period.toLowerCase()}`} />
      <SoldRankingCard
        title="By item"
        icon="restaurant-outline"
        rows={report.topSoldItems}
        color="#2DD4BF"
      />
      <SoldRankingCard
        title="By category"
        icon="pie-chart-outline"
        rows={report.topSoldByCategory}
        color="#60A5FA"
      />
      <SoldRankingCard
        title="By type"
        icon="layers-outline"
        rows={report.topSoldByType}
        color="#A78BFA"
      />
    </>
  );
}

function OrderStatusMetric({
  label,
  count,
  amount,
  color,
}: {
  label: string;
  count: number;
  amount: number;
  color: string;
}) {
  return (
    <View className="flex-1 rounded-lg bg-card-alt p-3">
      <Text className="text-[11px] font-semibold text-muted-foreground">{label}</Text>
      <Text className="text-xl font-extrabold mt-1" style={{ color }}>
        {formatNumber(count)}
      </Text>
      <Text className="text-[10px] text-text-faint mt-0.5">
        {formatETBCompact(amount)}
      </Text>
    </View>
  );
}

function SoldRankingCard({
  title,
  icon,
  rows,
  color,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  rows: CafePeriodReport["topSoldItems"];
  color: string;
}) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={17} color={color} />
        <Text className="text-sm font-extrabold text-foreground">{title}</Text>
      </View>
      {rows.length === 0 ? (
        <EmptyState icon="bar-chart-outline" title="No paid sales this month" />
      ) : (
        <RankBars
          rows={rows.map((row) => ({
            label: row.label,
            value: row.revenueETB,
            hint: `${formatNumber(row.quantity)} sold · est. profit ${formatETBCompact(row.profitETB)}`,
          }))}
          color={color}
        />
      )}
    </Card>
  );
}

function CafeFloorCard({
  cafe,
  openOrders,
}: {
  cafe: CafeOpsSnapshot;
  openOrders: number;
}) {
  return (
    <>
      <SectionHeader title="Floor readiness" />
      <View className="flex-row gap-2">
        <StatTile
          label="Menu items"
          value={formatNumber(cafe.menuItemCount)}
          icon="restaurant-outline"
          tone="#F472B6"
          toneBg="rgba(244, 114, 182, 0.14)"
        />
        <StatTile
          label="Tables"
          value={formatNumber(cafe.tableCount)}
          icon="grid-outline"
          tone="#A78BFA"
          toneBg="rgba(167, 139, 250, 0.14)"
        />
        <StatTile
          label="Live orders"
          value={formatNumber(openOrders)}
          icon="flame-outline"
          tone={openOrders > 0 ? "#FBBF24" : "#94A3B8"}
          toneBg={openOrders > 0 ? "rgba(251, 191, 36, 0.14)" : "#1A2438"}
        />
      </View>
    </>
  );
}

/* ── Lodging (Hotel / Resort / Pension) ────────────────────────────── */

function LodgingDashboard({
  data,
  cafeReport,
  cafeReportLoading,
  cafeReportError,
}: {
  data: PropertyDashboard;
  cafeReport: CafePeriodReport | null;
  cafeReportLoading: boolean;
  cafeReportError: string | null;
}) {
  const { operational, lodging: L, cafeOps, revenue } = data;
  const totalPending =
    operational.pendingPurchaseRequests +
    operational.pendingStockOutRequests +
    operational.pendingItemRegistrations;

  const guestServicesToday =
    (L?.todayRoomRevenueETB ?? 0) +
    (L?.todayFoodDrinkETB ?? 0) +
    (L?.todayLaundryETB ?? 0) +
    (L?.todayOtherServicesETB ?? 0);

  const { hasRooms, hasCm, hasCafe, hasInventory, hasApprovals, hasFinance, hasCredit } =
    propertyCapabilities(data.modules);

  if (!hasRooms && !hasCm && !hasCafe && !hasApprovals) {
    return (
      <>
        <Card>
          <EmptyState
            icon="layers-outline"
            title="No operational modules subscribed"
            subtitle="Subscribe to Rooms, Housekeeping, Café, or Inventory to see property ops here."
          />
        </Card>
        <SectionHeader title="Team" />
        <Card>
          <Row label="Active staff" value={formatNumber(operational.staffCount)} />
        </Card>
        <View className="h-6" />
      </>
    );
  }

  return (
    <>
      {/* Hero: occupancy + stay revenue */}
      <View className="rounded-xl overflow-hidden border border-border">
        <View className="bg-primary p-4 gap-1">
          <Text className="text-white/85 text-[13px] font-semibold">
            {hasRooms ? "Occupancy today" : hasApprovals ? "Pending approvals" : "Property pulse"}
          </Text>
          <View className="flex-row items-end justify-between">
            <Text className="text-white text-[34px] font-extrabold">
              {hasRooms
                ? `${L?.occupancyPct ?? 0}%`
                : formatNumber(hasApprovals ? totalPending : operational.staffCount)}
            </Text>
            {hasRooms && L ? (
              <Text className="text-white/90 text-[13px] font-semibold pb-1">
                {formatNumber(L.occupied)}/{formatNumber(L.totalRooms)} rooms
              </Text>
            ) : null}
          </View>
          <Text className="text-white/85 text-xs mt-0.5">
            {hasRooms
              ? `${formatNumber(L?.activeStays ?? 0)} in-house · ${formatNumber(L?.reservedStays ?? 0)} reserved · ${formatETBCompact(L?.monthStayRevenueETB)} settled this month`
              : `${formatNumber(operational.staffCount)} staff${
                  hasApprovals ? ` · ${formatNumber(totalPending)} pending approvals` : ""
                }`}
          </Text>
        </View>
        {hasRooms && L ? (
          <View className="flex-row bg-card">
            <OccBar segment="Ready" count={L.vacantClean} color="#4ADE80" total={L.totalRooms} />
            <OccBar segment="Dirty" count={L.vacantDirty} color="#FBBF24" total={L.totalRooms} />
            <OccBar segment="Busy" count={L.occupied} color="#60A5FA" total={L.totalRooms} />
            <OccBar segment="Maint." count={L.onMaintenance} color="#F87171" total={L.totalRooms} />
          </View>
        ) : null}
      </View>

      {hasRooms && L ? (
        <>
          <SectionHeader title="Rooms & stays" />
          <View className="flex-row gap-2">
            <StatTile
              label="Ready"
              value={formatNumber(L.vacantClean)}
              icon="checkmark-circle-outline"
              tone="#4ADE80"
              toneBg="rgba(74, 222, 128, 0.14)"
              hint={`${L.readyPct}% of rooms`}
            />
            <StatTile
              label="Needs clean"
              value={formatNumber(L.vacantDirty)}
              icon="brush-outline"
              tone={L.vacantDirty > 0 ? "#FBBF24" : "#94A3B8"}
              toneBg={L.vacantDirty > 0 ? "rgba(251, 191, 36, 0.14)" : "#1A2438"}
            />
            <StatTile
              label="Maintenance"
              value={formatNumber(L.onMaintenance)}
              icon="construct-outline"
              tone={L.onMaintenance > 0 ? "#F87171" : "#94A3B8"}
              toneBg={L.onMaintenance > 0 ? "rgba(248, 113, 113, 0.14)" : "#1A2438"}
            />
          </View>

          <Card>
            <Row label="Check-ins today" value={formatNumber(L.checkInsToday)} />
            <Row label="Check-outs today" value={formatNumber(L.checkOutsToday)} />
            <Row label="Open folios" value={formatETB(L.openFolioETB)} />
            <Row label="Settled this month" value={formatETB(L.monthStayRevenueETB)} />
          </Card>
        </>
      ) : null}

      {hasCm && L ? (
        <>
          <SectionHeader title="Cleaning & maintenance" />
          <View className="flex-row gap-2">
            <StatTile
              label="Open jobs"
              value={formatNumber(L.openCmAssignments)}
              icon="clipboard-outline"
              tone={L.openCmAssignments > 0 ? "#FBBF24" : "#4ADE80"}
              toneBg={
                L.openCmAssignments > 0
                  ? "rgba(251, 191, 36, 0.14)"
                  : "rgba(74, 222, 128, 0.14)"
              }
            />
            <StatTile
              label="Cleaning"
              value={formatNumber(L.openCleaning)}
              icon="water-outline"
              tone="#2DD4BF"
              toneBg="rgba(45, 212, 191, 0.14)"
            />
            <StatTile
              label="Repairs"
              value={formatNumber(L.openMaintenance)}
              icon="hammer-outline"
              tone="#FB923C"
              toneBg="rgba(251, 146, 60, 0.14)"
            />
          </View>
          {L.openCmAssignments > 0 || L.vacantDirty > 0 ? (
            <View className="flex-row items-center gap-2 bg-warning-soft p-3 rounded-lg">
              <Ionicons name="warning" size={16} color="#FBBF24" />
              <Text className="flex-1 text-[13px] font-semibold text-warning">
                {L.vacantDirty > 0
                  ? `${L.vacantDirty} room${L.vacantDirty === 1 ? "" : "s"} waiting to be cleaned`
                  : `${L.openCmAssignments} open housekeeping job${L.openCmAssignments === 1 ? "" : "s"}`}
                {L.openMaintenance > 0
                  ? ` · ${L.openMaintenance} on repair`
                  : ""}
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center gap-2 bg-success-soft p-3 rounded-lg">
              <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
              <Text className="flex-1 text-[13px] font-semibold text-success">
                Housekeeping queue is clear
              </Text>
            </View>
          )}
        </>
      ) : null}

      {L && (hasRooms || hasCafe) ? (
        <>
          <SectionHeader title="Guest services today" />
          <View className="rounded-xl bg-card border border-border p-4 gap-1 mb-1">
            <Text className="text-[13px] font-semibold text-muted-foreground">
              Charged to folios today
            </Text>
            <Text className="text-[26px] font-extrabold text-foreground">
              {formatETB(guestServicesToday)}
            </Text>
          </View>
          <View className="flex-row gap-2">
            {hasRooms ? (
              <StatTile
                label="Rooms"
                value={formatETBCompact(L.todayRoomRevenueETB)}
                icon="bed-outline"
                tone="#60A5FA"
                toneBg="rgba(96, 165, 250, 0.14)"
              />
            ) : null}
            {hasCafe ? (
              <StatTile
                label="F&B / room service"
                value={formatETBCompact(L.todayFoodDrinkETB)}
                icon="cafe-outline"
                tone="#F472B6"
                toneBg="rgba(244, 114, 182, 0.14)"
              />
            ) : null}
            {hasRooms ? (
              <StatTile
                label="Laundry"
                value={formatETBCompact(L.todayLaundryETB)}
                icon="shirt-outline"
                tone="#A78BFA"
                toneBg="rgba(167, 139, 250, 0.14)"
              />
            ) : null}
          </View>
        </>
      ) : null}

      {hasCafe ? (
        <>
          <SectionHeader title="Café & room service" />
          <Card>
            {hasRooms || hasCm ? (
              <>
                <Row
                  label="Room-service tickets open"
                  value={formatNumber(L?.roomServiceOpenOrders ?? 0)}
                />
                <Row
                  label="Room-service orders today"
                  value={formatNumber(L?.roomServiceOrdersToday ?? 0)}
                />
              </>
            ) : null}
            <Row label="Floor / F&B open orders" value={formatNumber(operational.openOrders)} />
            <Row label="Orders today (all)" value={formatNumber(operational.ordersToday)} />
            {cafeOps ? (
              <>
                <Row label="Menu items" value={formatNumber(cafeOps.menuItemCount)} />
                <Row label="Tables set up" value={formatNumber(cafeOps.tableCount)} />
                <Row label="Waiters" value={formatNumber(cafeOps.waiterCount)} />
                <Row label="Cancelled today" value={formatNumber(cafeOps.cancelledToday)} />
              </>
            ) : null}
          </Card>
          {revenue.todayRevenueETB > 0 || revenue.categories.length > 0 ? (
            <>
              <SectionHeader title="F&B paid sales today" />
              <Card>
                <SegmentedBar
                  segments={[
                    { label: "Cash", value: revenue.todayCashETB, color: "#4ADE80" },
                    { label: "Bank", value: revenue.todayBankETB, color: "#60A5FA" },
                    { label: "Credit", value: revenue.todayCreditETB, color: "#FBBF24" },
                  ]}
                />
              </Card>
            </>
          ) : null}
          {cafeReportError ? <ErrorCard message={cafeReportError} /> : null}
          {cafeReportLoading && !cafeReport ? (
            <Card>
              <Loading label="Loading café report…" />
            </Card>
          ) : cafeReport ? (
            <CafePeriodReportBlock report={cafeReport} hasCredit={hasCredit} />
          ) : null}
        </>
      ) : null}

      {hasApprovals ? (
        <>
          <SectionHeader
            title={hasFinance || hasInventory ? "Inventory approvals" : "Approvals"}
          />
          <View className="rounded-xl bg-card border border-border p-4 gap-1 mb-1">
            <Text className="text-[13px] font-semibold text-muted-foreground">
              Waiting on your team
            </Text>
            <Text className="text-[26px] font-extrabold text-foreground">
              {formatNumber(totalPending)}
            </Text>
          </View>
          <PipelineCard
            title="Purchase requests"
            icon="cart-outline"
            pipeline={operational.purchaseRequestPipeline}
          />
          <PipelineCard
            title="Stock movements"
            icon="swap-horizontal-outline"
            pipeline={operational.stockOutRequestPipeline}
          />
          <PipelineCard
            title="Item registrations"
            icon="cube-outline"
            pipeline={operational.itemRegistrationPipeline}
          />
        </>
      ) : null}

      {data.moduleHealth.length > 0 ? (
        <>
          <SectionHeader title="Module health" />
          {data.moduleHealth.map((m) => (
            <ModuleHealthCard key={m.module} health={m} />
          ))}
        </>
      ) : null}

      <SectionHeader title="Team" />
      <Card>
        <Row label="Active staff" value={formatNumber(operational.staffCount)} />
      </Card>

      <View className="h-6" />
    </>
  );
}

/* ── Shared building blocks ────────────────────────────────────────── */

function OccBar({
  segment,
  count,
  color,
  total,
}: {
  segment: string;
  count: number;
  color: string;
  total: number;
}) {
  const pct = total > 0 ? Math.max(count > 0 ? 8 : 0, (count / total) * 100) : 0;
  return (
    <View className="flex-1 items-center py-2.5 px-1 border-r border-border last:border-r-0">
      <View className="w-full h-1.5 rounded-full bg-card-alt overflow-hidden mb-1.5">
        <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </View>
      <Text className="text-[15px] font-extrabold" style={{ color }}>
        {count}
      </Text>
      <Text className="text-[10px] font-semibold text-muted-foreground mt-0.5">{segment}</Text>
    </View>
  );
}

function ModuleHealthCard({ health }: { health: ModuleHealth }) {
  const tone =
    health.alertLevel === "ok"
      ? { fg: "#4ADE80", bg: "rgba(74, 222, 128, 0.14)" }
      : health.alertLevel === "watch"
        ? { fg: "#FBBF24", bg: "rgba(251, 191, 36, 0.14)" }
        : { fg: "#F87171", bg: "rgba(248, 113, 113, 0.14)" };

  return (
    <Card className="gap-2.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-[15px] font-bold text-foreground">{health.label}</Text>
          <Text className="text-xs text-muted-foreground mt-0.5">{health.summary}</Text>
        </View>
        <Badge label={`${health.score}`} fg={tone.fg} bg={tone.bg} />
      </View>
      <View className="h-2 bg-card-alt rounded-full overflow-hidden">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${Math.max(4, health.score)}%`,
            backgroundColor: tone.fg,
          }}
        />
      </View>
      {health.metrics.length > 0 ? (
        <View className="flex-row flex-wrap gap-x-4 gap-y-1 mt-0.5">
          {health.metrics.map((m) => (
            <Text key={m.label} className="text-[11px] text-muted-foreground">
              <Text className="font-bold text-foreground">{m.value}</Text> {m.label}
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function PipelineCard({
  title,
  icon,
  pipeline,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  pipeline: ApprovalPipelineCounts | null;
}) {
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name={icon} size={18} color="#2DD4BF" />
        <Text className="text-[15px] font-bold text-foreground">{title}</Text>
      </View>
      <PipelineRow label="Pending CC" value={pipeline?.pendingCC} tone="#60A5FA" />
      <PipelineRow label="Checked by CC" value={pipeline?.checkedCC} tone="#60A5FA" />
      <PipelineRow label="Pending Finance" value={pipeline?.pendingFinance} tone="#FBBF24" />
      <PipelineRow label="Pending Manager" value={pipeline?.pendingManager} tone="#FBBF24" />
      <PipelineRow label="Recently authorized" value={pipeline?.authorized} tone="#4ADE80" />
    </Card>
  );
}

function PipelineRow({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number | null;
  tone: string;
}) {
  const n = value ?? 0;
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-[13px] text-muted-foreground">{label}</Text>
      <Text className="text-[14px] font-bold" style={{ color: n > 0 ? tone : "#64748B" }}>
        {n}
      </Text>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2 bg-destructive/15 p-3 rounded-lg">
      <Ionicons name="alert-circle" size={16} color="#F87171" />
      <Text className="flex-1 text-[13px] font-semibold text-destructive">{message}</Text>
    </View>
  );
}
