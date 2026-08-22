import React, { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PropertyPicker } from "@/components/property-picker";
import {
  AppButton,
  Badge,
  Card,
  EmptyState,
  Loading,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { Text } from "@/components/ui/text";
import { businessTypeLabel } from "@/lib/format";
import {
  moduleDescription,
  moduleLabel,
  parseModules,
  requestableModules,
  removableModules,
} from "@/lib/modules";
import { usePortfolio } from "@/lib/portfolio";
import { fetchPropertyDashboard, requestOwnerModuleChange } from "@/lib/queries";
import { statusTone } from "@/lib/theme";
import { useAlert } from "@/lib/alert";
import { usePropertyData } from "@/lib/use-property-data";

type RequestMode = "add" | "remove";

export default function TenantProfileScreen() {
  const router = useRouter();
  const portfolio = usePortfolio();
  const dashboard = usePropertyData(fetchPropertyDashboard);
  const [mode, setMode] = useState<RequestMode>("add");
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alert = useAlert();

  const property = portfolio.selected;
  const modules = useMemo(() => {
    const fromDash = parseModules(dashboard.data?.modules);
    if (fromDash.length) return fromDash;
    return parseModules(property?.modules);
  }, [dashboard.data?.modules, property?.modules]);

  const businessType =
    dashboard.data?.businessType ?? property?.businessType ?? null;

  const options = useMemo(
    () =>
      mode === "add"
        ? requestableModules(modules, businessType)
        : removableModules(modules),
    [mode, modules, businessType],
  );

  useEffect(() => {
    setSelected([]);
    setNote("");
    setError(null);
  }, [property?.tinNumber, mode]);

  const refresh = async () => {
    await Promise.all([dashboard.refresh(), portfolio.refresh()]);
  };

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name],
    );
  };

  const submit = async () => {
    if (!property) return;
    if (selected.length === 0) {
      setError("Select at least one module.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await requestOwnerModuleChange({
        tinNumber: property.tinNumber,
        changeType: mode,
        modules: selected,
        requestNote: note.trim() || undefined,
      });
      setSelected([]);
      setNote("");
      alert(
        "Request sent",
        mode === "add"
          ? "Your module add request was sent to HotCol for review."
          : "Your module removal request was sent to HotCol for review.",
        { variant: "success" },
      );
      await refresh();
    } catch (cause: any) {
      setError(cause?.message || "Could not submit module request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (portfolio.loading || (dashboard.loading && !dashboard.data && property)) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Loading label="Loading property modules…" />
      </SafeAreaView>
    );
  }

  const tone = statusTone(property?.subscriptionStatus ?? "active");

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-row items-center gap-2 px-4 pt-2 pb-1">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            className="h-10 w-10 items-center justify-center rounded-full bg-card border border-border"
          >
            <Ionicons name="chevron-back" size={22} color="#E2E8F0" />
          </Pressable>
          <Text className="flex-1 text-xl font-extrabold text-foreground">
            Modules
          </Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 pb-8 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={dashboard.refreshing}
              onRefresh={refresh}
              tintColor="#2DD4BF"
            />
          }
        >
          <PropertyPicker />

          {!property ? (
            <Card>
              <EmptyState
                icon="business-outline"
                title="No property selected"
                subtitle="Choose a property to view and request module changes."
              />
            </Card>
          ) : (
            <>
              <Card className="gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold text-foreground">
                      {dashboard.data?.hotelDisplayName || property.hotelDisplayName}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      TIN {property.tinNumber}
                      {businessType
                        ? ` · ${businessTypeLabel(businessType)}`
                        : ""}
                    </Text>
                  </View>
                  <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
                </View>
              </Card>

              <SectionHeader title="Current modules" />
              <Card padded={false}>
                {modules.length === 0 ? (
                  <View className="px-4 py-4">
                    <Text className="text-sm text-muted-foreground">
                      No modules on file for this property.
                    </Text>
                  </View>
                ) : (
                  modules.map((mod, idx) => (
                    <View
                      key={mod}
                      className={`px-4 py-3 ${idx < modules.length - 1 ? "border-b border-border" : ""}`}
                    >
                      <Text className="text-[15px] font-bold text-foreground">
                        {moduleLabel(mod)}
                      </Text>
                      {moduleDescription(mod) ? (
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {moduleDescription(mod)}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </Card>

              <SectionHeader title="Request a change" />
              <Card className="gap-3">
                <Text className="text-[13px] text-muted-foreground leading-5">
                  Apex reviews add and remove requests. Only one request can be
                  pending at a time.
                </Text>

                <View className="flex-row gap-2">
                  <ModeChip
                    label="Add modules"
                    active={mode === "add"}
                    onPress={() => setMode("add")}
                  />
                  <ModeChip
                    label="Remove modules"
                    active={mode === "remove"}
                    onPress={() => setMode("remove")}
                  />
                </View>

                {options.length === 0 ? (
                  <EmptyState
                    icon="cube-outline"
                    title={
                      mode === "add"
                        ? "Nothing left to add"
                        : "Nothing to remove"
                    }
                    subtitle={
                      mode === "add"
                        ? "No additional modules are available for this property type."
                        : "There are no removable modules on this property."
                    }
                  />
                ) : (
                  <View className="gap-1">
                    {options.map((mod) => {
                      const checked = selected.includes(mod);
                      return (
                        <Pressable
                          key={mod}
                          onPress={() => toggle(mod)}
                          className="flex-row items-start gap-3 rounded-lg border border-border bg-background/40 px-3 py-3"
                        >
                          <Ionicons
                            name={checked ? "checkbox" : "square-outline"}
                            size={22}
                            color={checked ? "#2DD4BF" : "#64748B"}
                          />
                          <View className="flex-1">
                            <Text className="text-[15px] font-bold text-foreground">
                              {moduleLabel(mod)}
                            </Text>
                            {moduleDescription(mod) ? (
                              <Text className="text-xs text-muted-foreground mt-0.5">
                                {moduleDescription(mod)}
                              </Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <TextField
                  label="Note (optional)"
                  value={note}
                  onChangeText={setNote}
                  placeholder={
                    mode === "add"
                      ? "Why you need these modules…"
                      : "Why these modules should be removed…"
                  }
                  multiline
                  className="h-24 py-3"
                  textAlignVertical="top"
                />

                {error ? (
                  <Text className="text-sm font-semibold text-destructive">{error}</Text>
                ) : null}

                <AppButton
                  title={
                    submitting
                      ? "Sending…"
                      : mode === "add"
                        ? "Request add"
                        : "Request remove"
                  }
                  icon="send-outline"
                  onPress={submit}
                  disabled={submitting || options.length === 0}
                />
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 items-center rounded-lg border px-3 py-2.5 ${
        active
          ? "border-primary bg-primary/15"
          : "border-border bg-card"
      }`}
    >
      <Text
        className={`text-[13px] font-bold ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
