import React, { useState } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import type { CafeReportPeriod } from "@/lib/use-cafe-report";

function formatPickerLabel(period: CafeReportPeriod, date: Date) {
  if (period === "Monthly") {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ReportPeriodPicker({
  period,
  date,
  onPeriodChange,
  onDateChange,
}: {
  period: CafeReportPeriod;
  date: Date;
  onPeriodChange: (period: CafeReportPeriod) => void;
  onDateChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);

  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed") return;
    if (selected) {
      const next = new Date(selected);
      if (period === "Monthly") next.setDate(1);
      const today = new Date();
      if (next > today) {
        onDateChange(today);
      } else {
        onDateChange(next);
      }
    }
  };

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {(["Daily", "Monthly"] as CafeReportPeriod[]).map((option) => {
          const active = period === option;
          return (
            <Pressable
              key={option}
              onPress={() => onPeriodChange(option)}
              className={`flex-1 items-center rounded-lg border px-3 py-2.5 ${
                active ? "border-primary bg-primary/15" : "border-border bg-card"
              }`}
            >
              <Text
                className={`text-[13px] font-bold ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 rounded-lg border border-border bg-card px-3 py-3"
      >
        <Ionicons
          name={period === "Monthly" ? "calendar-outline" : "today-outline"}
          size={18}
          color="#2DD4BF"
        />
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {period === "Monthly" ? "Report month" : "Report day"}
          </Text>
          <Text className="text-[15px] font-bold text-foreground mt-0.5">
            {formatPickerLabel(period, date)}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </Pressable>

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onNativeChange}
        />
      ) : null}

      {Platform.OS !== "android" ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setOpen(false)}>
            <Pressable
              className="bg-card rounded-t-2xl p-4 pb-8 gap-3"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="self-center w-10 h-1 rounded-full bg-border mb-1" />
              <Text className="text-[17px] font-extrabold text-foreground">
                {period === "Monthly" ? "Select month" : "Select date"}
              </Text>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                maximumDate={new Date()}
                onChange={onNativeChange}
                themeVariant="dark"
              />
              <Pressable
                onPress={() => setOpen(false)}
                className="h-[46px] items-center justify-center rounded-lg bg-primary"
              >
                <Text className="text-[15px] font-bold text-white">Done</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
