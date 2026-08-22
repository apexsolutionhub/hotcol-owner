import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { formatETB, formatETBCompact, formatNumber } from "@/lib/format";

/** Horizontal stacked bar (e.g. cash / bank / credit). */
export function SegmentedBar({
  segments,
  formatValue = formatETBCompact,
}: {
  segments: { label: string; value: number; color: string }[];
  formatValue?: (value: number) => string;
}) {
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) {
    return <View className="h-3 rounded-full bg-card-alt" />;
  }
  return (
    <View className="gap-2">
      <View className="h-3 flex-row rounded-full overflow-hidden bg-card-alt">
        {segments.map((seg) => {
          const pct = Math.max(0, seg.value) / total;
          if (pct <= 0) return null;
          return (
            <View
              key={seg.label}
              style={{ flex: pct, backgroundColor: seg.color }}
            />
          );
        })}
      </View>
      <View className="flex-row flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <View key={seg.label} className="flex-row items-center gap-1.5">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <Text className="text-[11px] text-muted-foreground">
              {seg.label}{" "}
              <Text className="font-bold text-foreground">
                {formatValue(seg.value)}
              </Text>
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Vertical dual bars for last N days (revenue vs profit). */
export function DualTrendChart({
  points,
}: {
  points: { label: string; revenueETB: number; profitETB: number }[];
}) {
  const max = Math.max(
    1,
    ...points.map((p) => Math.max(p.revenueETB, p.profitETB, 0)),
  );
  return (
    <View className="gap-2">
      <View className="flex-row items-end justify-between h-[120px] gap-1">
        {points.map((p) => {
          const revH = Math.max(4, (Math.max(0, p.revenueETB) / max) * 100);
          const profH = Math.max(3, (Math.max(0, p.profitETB) / max) * 100);
          return (
            <View key={p.label} className="flex-1 items-center gap-1">
              <View className="flex-row items-end gap-0.5 h-[100px]">
                <View
                  className="w-[7px] rounded-t-sm bg-primary/55"
                  style={{ height: revH }}
                />
                <View
                  className="w-[7px] rounded-t-sm bg-success"
                  style={{ height: profH }}
                />
              </View>
              <Text className="text-[10px] font-semibold text-muted-foreground">
                {p.label}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="flex-row gap-4">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-sm bg-primary/55" />
          <Text className="text-[11px] text-muted-foreground">Revenue</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-sm bg-success" />
          <Text className="text-[11px] text-muted-foreground">Est. profit</Text>
        </View>
      </View>
    </View>
  );
}

/** Horizontal ranking bars with optional secondary value. */
export function RankBars({
  rows,
  valueKey = "value",
  color = "#2DD4BF",
  formatValue = formatETB,
}: {
  rows: { label: string; value: number; hint?: string }[];
  valueKey?: string;
  color?: string;
  formatValue?: (n: number) => string;
}) {
  void valueKey;
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return null;
  return (
    <View className="gap-3">
      {rows.map((r) => (
        <View key={r.label} className="gap-1.5">
          <View className="flex-row justify-between items-center">
            <Text
              className="text-[13px] font-semibold text-foreground flex-1 pr-2"
              numberOfLines={1}
            >
              {r.label}
            </Text>
            <Text className="text-[13px] font-bold text-muted-foreground">
              {formatValue(r.value)}
            </Text>
          </View>
          <View className="h-2 bg-card-alt rounded-full overflow-hidden">
            <View
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(4, (r.value / max) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </View>
          {r.hint ? (
            <Text className="text-[11px] text-text-faint">{r.hint}</Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

/** Simple metric ring / progress gauge. */
export function GaugeRow({
  label,
  value,
  max,
  tone = "#2DD4BF",
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  tone?: string;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <View className="gap-1.5 py-1.5">
      <View className="flex-row justify-between">
        <Text className="text-[13px] text-muted-foreground">{label}</Text>
        <Text className="text-[13px] font-bold" style={{ color: tone }}>
          {formatNumber(value)}
          {suffix ? ` ${suffix}` : ""}
          {max > 0 ? ` · ${pct}%` : ""}
        </Text>
      </View>
      <View className="h-2 bg-card-alt rounded-full overflow-hidden">
        <View
          className="h-2 rounded-full"
          style={{ width: `${Math.max(value > 0 ? 6 : 0, pct)}%`, backgroundColor: tone }}
        />
      </View>
    </View>
  );
}

/** Waterfall-style profit breakdown: sales → cost → profit. */
export function ProfitWaterfall({
  revenue,
  cost,
  profit,
}: {
  revenue: number;
  cost: number;
  profit: number;
}) {
  const max = Math.max(revenue, cost, Math.abs(profit), 1);
  return (
    <View className="gap-3">
      <WaterfallRow label="Sales" value={revenue} max={max} color="#60A5FA" />
      <WaterfallRow label="Ingredient cost" value={cost} max={max} color="#F87171" />
      <WaterfallRow
        label="Est. profit"
        value={profit}
        max={max}
        color={profit >= 0 ? "#4ADE80" : "#F87171"}
      />
    </View>
  );
}

function WaterfallRow({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text className="text-[13px] text-muted-foreground">{label}</Text>
        <Text className="text-[13px] font-bold text-foreground">{formatETB(value)}</Text>
      </View>
      <View className="h-2.5 bg-card-alt rounded-full overflow-hidden">
        <View
          className="h-2.5 rounded-full"
          style={{
            width: `${Math.max(4, (Math.abs(value) / max) * 100)}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
