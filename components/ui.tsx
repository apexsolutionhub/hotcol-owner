import React from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { Text } from "@/components/ui/text";

export function Card({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  style?: any;
}) {
  return (
    <View
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm shadow-black/30",
        padded && "p-4",
        className
      )}
    >
      {children}
    </View>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-base font-bold text-foreground">{title}</Text>
      {action}
    </View>
  );
}

export function Badge({
  label,
  fg,
  bg,
}: {
  label: string;
  fg: string;
  bg: string;
}) {
  return (
    <View className="self-start rounded-full px-2.5 py-1" style={{ backgroundColor: bg }}>
      <Text className="text-xs font-bold" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  icon,
  tone = "#2DD4BF",
  toneBg = "rgba(45, 212, 191, 0.14)",
  hint,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: string;
  toneBg?: string;
  hint?: string;
}) {
  return (
    <View className="flex-1 min-w-0 gap-1.5 rounded-lg border border-border bg-card p-3">
      <View
        className="h-8 w-8 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: toneBg }}
      >
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text className="text-lg font-extrabold text-foreground" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-xs font-semibold text-muted-foreground">{label}</Text>
      {hint ? <Text className="text-[11px] text-text-faint">{hint}</Text> : null}
    </View>
  );
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  className,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  style?: any;
}) {
  const palette = {
    primary: { bg: "bg-primary", fg: "#FFFFFF", text: "text-white", border: "border-primary" },
    secondary: { bg: "bg-card", fg: "#2DD4BF", text: "text-primary", border: "border-primary" },
    danger: { bg: "bg-destructive/15", fg: "#F87171", text: "text-destructive", border: "border-destructive/15" },
    ghost: { bg: "bg-transparent", fg: "#94A3B8", text: "text-muted-foreground", border: "border-transparent" },
  }[variant];

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        "h-[50px] items-center justify-center rounded-lg border px-4",
        palette.bg,
        palette.border,
        isDisabled && "opacity-55",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon ? <Ionicons name={icon} size={18} color={palette.fg} /> : null}
          <Text className={cn("text-[15px] font-bold", palette.text)}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  className,
  ...props
}: TextInputProps & { label?: string; className?: string; style?: any }) {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-[13px] font-semibold text-muted-foreground">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#64748B"
        className={cn(
          "h-[50px] rounded-lg border border-border bg-card px-3 text-[15px] text-foreground",
          className
        )}
        {...props}
      />
    </View>
  );
}

export function EmptyState({
  icon = "file-tray-outline",
  title,
  subtitle,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="items-center justify-center gap-2 py-8">
      <Ionicons name={icon} size={34} color="#64748B" />
      <Text className="text-[15px] font-bold text-foreground">{title}</Text>
      {subtitle ? (
        <Text className="text-center text-[13px] text-muted-foreground px-4">{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-6">
      <ActivityIndicator color="#2DD4BF" size="large" />
      {label ? <Text className="text-sm text-muted-foreground">{label}</Text> : null}
    </View>
  );
}

export function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="shrink text-sm text-muted-foreground pr-3">{label}</Text>
      <Text className="shrink text-right text-sm font-bold text-foreground" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </Text>
    </View>
  );
}

export function Avatar({ text, color = "#2DD4BF" }: { text: string; color?: string }) {
  return (
    <View
      className="h-[42px] w-[42px] items-center justify-center rounded-full"
      style={{ backgroundColor: color }}
    >
      <Text className="text-[15px] font-extrabold text-white">{text}</Text>
    </View>
  );
}
