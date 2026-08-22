import React, { useState } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { usePortfolio } from "@/lib/portfolio";
import { businessTypeLabel } from "@/lib/format";

export function PropertyPicker() {
  const { properties, selected, selectProperty } = usePortfolio();
  const [open, setOpen] = useState(false);

  if (properties.length === 0) {
    return (
      <View className="flex-row items-center gap-1.5 max-w-[220px] bg-primary/15 px-3 py-[7px] rounded-full">
        <Text className="text-sm font-bold text-foreground shrink">No properties</Text>
      </View>
    );
  }

  const single = properties.length === 1;

  return (
    <>
      <Pressable
        className="flex-row items-center gap-1.5 max-w-[220px] bg-primary/15 px-3 py-[7px] rounded-full"
        disabled={single}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="business" size={16} color="#2DD4BF" />
        <Text className="text-sm font-bold text-foreground shrink" numberOfLines={1}>
          {selected?.hotelDisplayName ?? "Select property"}
        </Text>
        {!single ? <Ionicons name="chevron-down" size={16} color="#94A3B8" /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-card rounded-t-2xl p-4 pb-8 gap-2" onPress={(e) => e.stopPropagation()}>
            <View className="self-center w-10 h-1 rounded-full bg-border mb-2" />
            <Text className="text-[17px] font-extrabold text-foreground mb-1">Switch property</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {properties.map((p) => {
                const active = p.tinNumber === selected?.tinNumber;
                return (
                  <Pressable
                    key={p.tinNumber}
                    className={`flex-row items-center gap-2.5 py-3 px-3 rounded-lg ${active ? "bg-primary/15" : ""}`}
                    onPress={() => {
                      selectProperty(p.tinNumber);
                      setOpen(false);
                    }}
                  >
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-foreground" numberOfLines={1}>
                        {p.hotelDisplayName}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5">
                        {businessTypeLabel(p.businessType)} · {p.tinNumber}
                      </Text>
                    </View>
                    {p.needsAttention ? (
                      <Ionicons name="alert-circle" size={18} color="#FBBF24" />
                    ) : null}
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color="#2DD4BF" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
