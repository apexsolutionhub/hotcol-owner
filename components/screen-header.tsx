import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { PropertyPicker } from "./property-picker";

export function ScreenHeader({
  title,
  subtitle,
  showPicker = true,
  right,
}: {
  title: string;
  subtitle?: string;
  showPicker?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <View className="px-4 pt-2 pb-3 gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-foreground">{title}</Text>
        {right}
      </View>
      {showPicker ? (
        <View className="flex-row">
          <PropertyPicker />
        </View>
      ) : subtitle ? (
        <Text className="text-[13px] text-muted-foreground">{subtitle}</Text>
      ) : null}
    </View>
  );
}
