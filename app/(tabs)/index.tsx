import React, { useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { ScreenHeader } from "@/components/screen-header";
import { Badge, Card, EmptyState, Loading, StatTile } from "@/components/ui";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { statusTone } from "@/lib/theme";
import {
  businessTypeLabel,
  businessTypeIcon,
  isLodgingType,
  formatETB,
  formatETBCompact,
  formatNumber,
} from "@/lib/format";
import { moduleChips, propertyCapabilities } from "@/lib/modules";
import type { OwnerProperty } from "@/lib/types";

export default function PortfolioScreen() {
  const { owner } = useAuth();
  const { summary, loading, error, refresh, selectProperty } = usePortfolio();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const openProperty = (p: OwnerProperty) => {
    selectProperty(p.tinNumber);
    router.navigate(p.accessBlocked ? "/payment-approval" : "/sales");
  };

  if (loading && !summary) return <Loading label="Loading portfolio…" />;

  const props = summary?.properties ?? [];
  const showRoomsTile = props.some((p) => propertyCapabilities(p.modules).hasRooms);
  const showCmTile = props.some((p) => propertyCapabilities(p.modules).hasCm);
  const showCafeOrders = props.some((p) => propertyCapabilities(p.modules).hasCafe);
  const showApprovals = props.some((p) => propertyCapabilities(p.modules).hasApprovals);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader
        title={greeting(owner?.displayName || owner?.UserName)}
        showPicker={false}
        subtitle="Your portfolio at a glance"
      />
      <ScrollView
        contentContainerClassName="px-4 gap-3 pb-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2DD4BF" />
        }
      >
        {error ? (
          <Card className="bg-destructive/15 border-destructive/15">
            <Text className="font-semibold text-destructive">{error}</Text>
          </Card>
        ) : null}

        <View className="flex-row gap-3">
          <StatTile
            label="Today's revenue"
            value={formatETBCompact(summary?.todayRevenueETB)}
            icon="cash"
            tone="#4ADE80"
            toneBg="rgba(74, 222, 128, 0.14)"
          />
          <StatTile
            label="This month"
            value={formatETBCompact(summary?.monthRevenueETB)}
            icon="calendar"
            tone="#60A5FA"
            toneBg="rgba(96, 165, 250, 0.14)"
          />
        </View>
        {(showCafeOrders || showApprovals) && (
          <View className="flex-row gap-3">
            {showCafeOrders ? (
              <StatTile
                label="Open orders"
                value={formatNumber(summary?.openOrders)}
                icon="receipt"
                tone="#FBBF24"
                toneBg="rgba(251, 191, 36, 0.14)"
              />
            ) : null}
            {showApprovals ? (
              <StatTile
                label="Pending approvals"
                value={formatNumber(summary?.pendingApprovals)}
                icon="checkmark-done"
                tone="#2DD4BF"
                toneBg="rgba(45, 212, 191, 0.14)"
              />
            ) : null}
            {!showCafeOrders && showApprovals ? <View className="flex-1" /> : null}
            {showCafeOrders && !showApprovals ? <View className="flex-1" /> : null}
          </View>
        )}

        {(showRoomsTile || showCmTile) && (
          <View className="flex-row gap-3">
            {showRoomsTile ? (
              <StatTile
                label="Guests in-house"
                value={formatNumber(
                  props.reduce(
                    (s, p) =>
                      s +
                      (propertyCapabilities(p.modules).hasRooms ? p.activeStays ?? 0 : 0),
                    0,
                  ),
                )}
                icon="bed"
                tone="#A78BFA"
                toneBg="rgba(167, 139, 250, 0.14)"
              />
            ) : null}
            {showCmTile ? (
              <StatTile
                label="CM queue"
                value={formatNumber(summary?.openCmJobs)}
                icon="construct"
                tone={(summary?.openCmJobs ?? 0) > 0 ? "#FB923C" : "#94A3B8"}
                toneBg={
                  (summary?.openCmJobs ?? 0) > 0
                    ? "rgba(251, 146, 60, 0.14)"
                    : "#1A2438"
                }
              />
            ) : null}
            {showRoomsTile && !showCmTile ? <View className="flex-1" /> : null}
            {!showRoomsTile && showCmTile ? <View className="flex-1" /> : null}
          </View>
        )}

        {summary && summary.attentionCount > 0 ? (
          <View className="flex-row items-center gap-2 bg-warning-soft p-3 rounded-lg">
            <Ionicons name="warning" size={18} color="#FBBF24" />
            <Text className="flex-1 text-[13px] font-semibold text-warning">
              {summary.attentionCount} propert
              {summary.attentionCount === 1 ? "y needs" : "ies need"} attention
              (billing or account status).
            </Text>
          </View>
        ) : null}

        <Text className="text-base font-extrabold text-foreground mt-2">
          Properties ({summary?.propertyCount ?? 0})
        </Text>

        {(summary?.properties.length ?? 0) === 0 ? (
          <Card>
            <EmptyState
              icon="business-outline"
              title="No properties linked yet"
              subtitle="Ask HotCol support to link your cafés / hotels to this owner account."
            />
          </Card>
        ) : (
          summary!.properties.map((p) => (
            <PropertyCard key={p.tinNumber} property={p} onPress={() => openProperty(p)} />
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}

function PropertyCard({
  property,
  onPress,
}: {
  property: OwnerProperty;
  onPress: () => void;
}) {
  const tone = statusTone(
    property.accessBlocked &&
      (property.accountStatus === "suspended" || property.accountStatus === "banned")
      ? property.accountStatus
      : property.subscriptionStatus,
  );
  const lodging = isLodgingType(property.businessType);
  const caps = propertyCapabilities(property.modules);
  const chips = moduleChips(property.modules);
  const dirty = caps.hasRooms || caps.hasCm ? property.vacantDirty ?? 0 : 0;
  const cm = caps.hasCm ? property.openCmAssignments ?? 0 : 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="w-[42px] h-[42px] rounded-xl bg-primary/15 items-center justify-center">
            <Ionicons
              name={businessTypeIcon(property.businessType) as any}
              size={20}
              color="#2DD4BF"
            />
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-foreground" numberOfLines={1}>
              {property.hotelDisplayName}
            </Text>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {businessTypeLabel(property.businessType)}
              {caps.hasRooms && property.occupancyPct != null
                ? ` · ${property.occupancyPct}% occupied`
                : ""}
            </Text>
          </View>
          <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
        </View>

        {chips.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {chips.map((label) => (
              <Badge
                key={label}
                label={label}
                fg="#94A3B8"
                bg="rgba(148, 163, 184, 0.12)"
              />
            ))}
          </View>
        ) : null}

        {property.accessBlocked ? (
          <View className="rounded-lg bg-warning-soft px-3 py-3 flex-row gap-2">
            <Ionicons name="lock-closed" size={16} color="#FBBF24" />
            <Text className="flex-1 text-[12px] leading-5 font-semibold text-warning">
              {property.accessBlockReason || "Operations are locked pending account approval."}
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row gap-3">
              <CardStat label="Today" value={formatETB(property.todayRevenueETB)} />
              <CardStat label="Month" value={formatETB(property.monthRevenueETB)} />
            </View>
            {lodging || caps.hasRooms || caps.hasCm ? (
              <>
                <View className="flex-row gap-3">
                  {caps.hasRooms ? (
                    <CardStat label="In-house" value={formatNumber(property.activeStays)} />
                  ) : null}
                  {caps.hasApprovals ? (
                    <CardStat label="Approvals" value={formatNumber(property.pendingApprovals)} />
                  ) : null}
                  <CardStat label="Staff" value={formatNumber(property.staffCount)} />
                </View>
                {(dirty > 0 || cm > 0) && (
                  <View className="flex-row items-center gap-2 rounded-lg bg-warning-soft px-3 py-2">
                    <Ionicons name="brush" size={14} color="#FBBF24" />
                    <Text className="flex-1 text-[12px] font-semibold text-warning">
                      {dirty > 0 ? `${dirty} dirty` : ""}
                      {dirty > 0 && cm > 0 ? " · " : ""}
                      {cm > 0 ? `${cm} CM open` : ""}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View className="flex-row gap-3">
                {caps.hasCafe ? (
                  <CardStat label="Open orders" value={formatNumber(property.openOrders)} />
                ) : null}
                {caps.hasApprovals ? (
                  <CardStat label="Approvals" value={formatNumber(property.pendingApprovals)} />
                ) : null}
                <CardStat label="Staff" value={formatNumber(property.staffCount)} />
              </View>
            )}
          </>
        )}

        <Separator />
        <View className="flex-row items-center justify-end gap-1">
          <Text className="text-primary font-bold text-[13px]">
            {property.accessBlocked
              ? "Open payment approval"
              : lodging || caps.hasRooms || caps.hasCm
                ? "View operations"
                : "View sales"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#2DD4BF" />
        </View>
      </Card>
    </Pressable>
  );
}

function CardStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1">
      <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
        {value}
      </Text>
      <Text className="text-[11px] text-muted-foreground mt-0.5">{label}</Text>
    </View>
  );
}

function greeting(name?: string | null) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const who = String(name || "").split(" ")[0];
  return who ? `${part}, ${who}` : part;
}
