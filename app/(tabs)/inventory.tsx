import React from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { Badge, Card, EmptyState, Loading, SectionHeader, StatTile } from "@/components/ui";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { usePropertyData } from "@/lib/use-property-data";
import { usePortfolio } from "@/lib/portfolio";
import { fetchPropertyInventory } from "@/lib/queries";
import { formatETB, formatETBCompact, formatNumber, formatDate, isLodgingType, approvalStatusLabel, approvalStatusTone } from "@/lib/format";
import { propertyCapabilities } from "@/lib/modules";
import type { InventoryItem } from "@/lib/types";

export default function InventoryScreen() {
  const { data, loading, refreshing, error, tin, refresh } =
    usePropertyData(fetchPropertyInventory);
  const { selected } = usePortfolio();
  const isLodging = isLodgingType(selected?.businessType);
  const { hasInventory } = propertyCapabilities(selected?.modules);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader title="Inventory" />
      {!tin ? (
        <Card className="m-4">
          <EmptyState icon="business-outline" title="No property selected" />
        </Card>
      ) : !hasInventory ? (
        <Card className="m-4">
          <EmptyState
            icon="cube-outline"
            title="Inventory module not subscribed"
            subtitle="Stock value, expiry alerts, and item lists appear once this property subscribes to Inventory."
          />
        </Card>
      ) : loading && !data ? (
        <Loading label="Loading inventory…" />
      ) : (
        <ScrollView
          contentContainerClassName="px-4 gap-3 pb-4"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#2DD4BF" />}
        >
          {error ? (
            <View className="flex-row items-center gap-2 bg-destructive/15 p-3 rounded-lg">
              <Ionicons name="alert-circle" size={16} color="#F87171" />
              <Text className="flex-1 text-[13px] font-semibold text-destructive">{error}</Text>
            </View>
          ) : null}

          {data ? (
            <>
              <View className="flex-row gap-2">
                <StatTile
                  label="Stock value"
                  value={formatETBCompact(data.totalValueETB)}
                  icon="pricetags"
                  tone="#2DD4BF"
                  toneBg="rgba(45, 212, 191, 0.14)"
                />
                <StatTile
                  label="Items"
                  value={formatNumber(data.itemCount)}
                  icon="cube"
                  tone="#60A5FA"
                  toneBg="rgba(96, 165, 250, 0.14)"
                />
                <StatTile
                  label="Expiring ≤14d"
                  value={formatNumber(data.expiringSoon)}
                  icon="alert"
                  tone={data.expiringSoon > 0 ? "#FBBF24" : "#94A3B8"}
                  toneBg={data.expiringSoon > 0 ? "rgba(251, 191, 36, 0.14)" : "#1A2438"}
                />
              </View>

              {data.expiringSoon > 0 ? (
                <View className="flex-row items-center gap-2 bg-warning-soft p-3 rounded-lg">
                  <Ionicons name="warning" size={16} color="#FBBF24" />
                  <Text className="flex-1 text-[13px] font-semibold text-warning">
                    {data.expiringSoon} item{data.expiringSoon === 1 ? "" : "s"} expire within 14
                    days — review with store / cost control.
                  </Text>
                </View>
              ) : null}

              {isLodging ? (
                <Text className="text-xs text-muted-foreground -mt-1">
                  Hotel inventory includes purchases and stock movements that route through CC →
                  Finance → Manager before stock is live.
                </Text>
              ) : null}

              <SectionHeader title={`Stock items (${data.items.length})`} />
              {data.items.length === 0 ? (
                <Card>
                  <EmptyState
                    icon="cube-outline"
                    title="No stock on record"
                    subtitle="This property has no active inventory items yet."
                  />
                </Card>
              ) : (
                <Card padded={false}>
                  {data.items.map((item, idx) => (
                    <InventoryRow
                      key={item.id}
                      item={item}
                      last={idx === data.items.length - 1}
                      isLodging={isLodging}
                    />
                  ))}
                </Card>
              )}
              <View className="h-6" />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function InventoryRow({ item, last, isLodging }: { item: InventoryItem; last: boolean; isLodging: boolean }) {
  const exp = item.expireDate ? new Date(item.expireDate).getTime() : null;
  const soon = exp ? exp > Date.now() && exp <= Date.now() + 14 * 864e5 : false;
  const expired = exp ? exp <= Date.now() : false;
  return (
    <View className="flex-row items-center px-4 py-3">
      <View className="flex-1 pr-2">
        <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {formatNumber(item.amount)} {item.measuredBy || "units"} ·{" "}
          {formatETB(item.unitPrice)}/unit
          {item.category ? ` · ${item.category}` : ""}
        </Text>
        {item.supplierName ? (
          <Text className="text-[11px] text-text-faint mt-0.5" numberOfLines={1}>
            Supplier: {item.supplierName}
          </Text>
        ) : null}
        {item.expireDate ? (
          <Text
            className={`text-[11px] mt-0.5 font-semibold ${
              expired ? "text-destructive" : soon ? "text-warning" : "text-text-faint"
            }`}
          >
            {expired ? "Expired " : "Expires "}
            {formatDate(item.expireDate)}
          </Text>
        ) : null}
      </View>
      {isLodging ? (
        <View className="items-end gap-1">
          {item.approvalStatus ? (
            <Badge
              label={approvalStatusLabel(item.approvalStatus)}
              fg={approvalStatusTone(item.approvalStatus).fg}
              bg={approvalStatusTone(item.approvalStatus).bg}
            />
          ) : null}
          <Text className="text-sm font-extrabold text-foreground">{formatETB(item.totalValueETB)}</Text>
        </View>
      ) : (
        <Text className="text-sm font-extrabold text-foreground">{formatETB(item.totalValueETB)}</Text>
      )}
      {!last ? <Separator className="absolute bottom-0 left-4 right-0" /> : null}
    </View>
  );
}
