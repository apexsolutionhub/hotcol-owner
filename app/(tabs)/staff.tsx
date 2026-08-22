import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/screen-header";
import {
  AppButton,
  Avatar,
  Badge,
  Card,
  EmptyState,
  Loading,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { usePortfolio } from "@/lib/portfolio";
import { usePropertyData } from "@/lib/use-property-data";
import {
  createStaffRequest,
  fetchPropertyInventoryPeople,
  fetchPropertyStaff,
  fetchPropertyWaiters,
  setStaffLoginDisabledRequest,
  setStaffPasswordRequest,
} from "@/lib/queries";
import { useAlert } from "@/lib/alert";
import { MODULES, propertyCapabilities } from "@/lib/modules";
import { formatETBCompact, formatNumber, initials, isLodgingType, roleLabel } from "@/lib/format";
import type { CostControllerRow, DepartmentLeaderRow, StaffMember } from "@/lib/types";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "Cashier", label: "Cashier" },
  { value: "Kitchen", label: "Chef / Kitchen" },
  { value: "Barista", label: "Bar" },
  { value: "Store", label: "Store" },
  { value: "CostControl", label: "Cost Control" },
  { value: "Finance", label: "Finance" },
  { value: "HotelCashier", label: "Hotel Cashier" },
  { value: "Reception", label: "Reception" },
  { value: "CMLeader", label: "CM Leader" },
  { value: "HR", label: "HR" },
];

const ROLE_MODULE_MAP: Record<string, string> = {
  Kitchen: MODULES.cafe,
  Barista: MODULES.cafe,
  Cashier: MODULES.cafe,
  Store: MODULES.inventory,
  CostControl: MODULES.finance,
  Finance: MODULES.finance,
  HotelCashier: MODULES.credit,
  Reception: MODULES.rooms,
  CMLeader: MODULES.cm,
  HR: MODULES.hr,
};

function filterRolesForModules(modules: string[] | null): typeof ROLE_OPTIONS {
  if (!modules || modules.length === 0) return ROLE_OPTIONS;
  return ROLE_OPTIONS.filter((r) => {
    const required = ROLE_MODULE_MAP[r.value];
    return !required || modules.includes(required);
  });
}

export default function StaffScreen() {
  const { selected } = usePortfolio();
  const staff = usePropertyData(fetchPropertyStaff);
  const isLodging = isLodgingType(selected?.businessType);
  const { hasCafe, hasInventory, isInventoryFocused } = propertyCapabilities(
    selected?.modules,
  );
  const showInventoryPeople =
    isInventoryFocused || (isLodging && hasInventory && hasCafe);
  const waiters = usePropertyData(fetchPropertyWaiters, hasCafe);
  const inventoryPeople = usePropertyData(
    fetchPropertyInventoryPeople,
    showInventoryPeople,
  );
  const [showCreate, setShowCreate] = useState(false);
  const [target, setTarget] = useState<StaffMember | null>(null);

  const onRefresh = async () => {
    const tasks: Promise<void>[] = [staff.refresh()];
    if (hasCafe) tasks.push(waiters.refresh());
    if (showInventoryPeople) tasks.push(inventoryPeople.refresh());
    await Promise.all(tasks);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader
        title="Staff"
        right={
          selected ? (
            <Pressable
              className="w-[38px] h-[38px] rounded-full bg-primary items-center justify-center"
              onPress={() => setShowCreate(true)}
            >
              <Ionicons name="person-add" size={18} color="#FFFFFF" />
            </Pressable>
          ) : undefined
        }
      />

      {!staff.tin ? (
        <Card className="m-4">
          <EmptyState icon="business-outline" title="No property selected" />
        </Card>
      ) : staff.loading && !staff.data ? (
        <Loading label="Loading staff…" />
      ) : (
        <ScrollView
          contentContainerClassName="px-4 gap-3 pb-4"
          refreshControl={
            <RefreshControl
              refreshing={
                staff.refreshing ||
                (hasCafe && waiters.refreshing) ||
                (showInventoryPeople && inventoryPeople.refreshing)
              }
              onRefresh={onRefresh}
              tintColor="#2DD4BF"
            />
          }
        >
          {staff.error ? <ErrorBanner message={staff.error} /> : null}

          <SectionHeader title={`Staff accounts (${staff.data?.length ?? 0})`} />
          {(staff.data?.length ?? 0) === 0 ? (
            <Card>
              <EmptyState
                icon="people-outline"
                title="No staff accounts yet"
                subtitle="Tap the add button to create login credentials for your team."
              />
            </Card>
          ) : (
            <Card padded={false}>
              {staff.data!.map((s, idx) => (
                <StaffRow
                  key={s.id}
                  member={s}
                  last={idx === staff.data!.length - 1}
                  onPress={() => setTarget(s)}
                />
              ))}
            </Card>
          )}

          {showInventoryPeople ? (
            <InventoryPeopleSections
              loading={inventoryPeople.loading && !inventoryPeople.data}
              error={inventoryPeople.error}
              leaders={inventoryPeople.data?.departmentLeaders ?? []}
              controllers={inventoryPeople.data?.costControllers ?? []}
            />
          ) : null}

          {hasCafe ? (
            <>
              {waiters.error ? <ErrorBanner message={waiters.error} /> : null}
              <SectionHeader
                title={`${isLodging ? "Waiters / F&B floor" : "Waiters"} (${waiters.data?.length ?? 0})`}
              />
              {waiters.loading && !waiters.data ? (
                <Card>
                  <Text className="text-[13px] text-muted-foreground">
                    Loading waiters…
                  </Text>
                </Card>
              ) : (waiters.data?.length ?? 0) === 0 ? (
                <Card>
                  <EmptyState
                    icon="restaurant-outline"
                    title="No waiters registered yet"
                    subtitle="Waiters registered in the tenant café module will appear here."
                  />
                </Card>
              ) : (
                <Card padded={false}>
                  {waiters.data!.map((w, idx) => (
                    <View key={w.id} className="flex-row items-center px-4 py-3">
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-foreground">
                          {w.name}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {formatNumber(w.completedOrders)} orders served
                        </Text>
                      </View>
                      <Text className="text-sm font-extrabold text-foreground">
                        {formatETBCompact(w.totalSalesETB)}
                      </Text>
                      {idx !== waiters.data!.length - 1 ? (
                        <Separator className="absolute bottom-0 left-4 right-0" />
                      ) : null}
                    </View>
                  ))}
                </Card>
              )}
            </>
          ) : null}

          <View className="h-6" />
        </ScrollView>
      )}

      <CreateStaffModal
        visible={showCreate}
        tin={staff.tin}
        modules={selected?.modules ?? null}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          void staff.refresh();
        }}
      />

      <StaffActionsModal
        member={target}
        onClose={() => setTarget(null)}
        onChanged={() => {
          setTarget(null);
          void staff.refresh();
        }}
      />
    </SafeAreaView>
  );
}

function InventoryPeopleSections({
  loading,
  error,
  leaders,
  controllers,
}: {
  loading: boolean;
  error: string | null;
  leaders: DepartmentLeaderRow[];
  controllers: CostControllerRow[];
}) {
  return (
    <>
      {error ? <ErrorBanner message={error} /> : null}

      <SectionHeader title={`Department leaders (${leaders.length})`} />
      {loading ? (
        <Card>
          <Text className="text-[13px] text-muted-foreground">Loading leaders…</Text>
        </Card>
      ) : leaders.length === 0 ? (
        <Card>
          <EmptyState
            icon="briefcase-outline"
            title="No department leaders yet"
            subtitle="Managers register department leaders in the tenant app for stock-out accountability."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {leaders.map((row, idx) => (
            <View key={row.id} className="flex-row items-start px-4 py-3">
              <View className="flex-1 pr-2">
                <Text className="text-[15px] font-bold text-foreground">
                  {row.departmentLabel}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={3}>
                  {row.leaderName || "—"}
                </Text>
              </View>
              {idx !== leaders.length - 1 ? (
                <Separator className="absolute bottom-0 left-4 right-0" />
              ) : null}
            </View>
          ))}
        </Card>
      )}

      <SectionHeader title={`Cost controller IDs (${controllers.length})`} />
      {loading ? (
        <Card>
          <Text className="text-[13px] text-muted-foreground">Loading controllers…</Text>
        </Card>
      ) : controllers.length === 0 ? (
        <Card>
          <EmptyState
            icon="id-card-outline"
            title="No cost controller IDs yet"
            subtitle="Named cost controllers are selected when checking purchases and stock movements."
          />
        </Card>
      ) : (
        <Card padded={false}>
          {controllers.map((row, idx) => (
            <View key={row.id} className="flex-row items-center px-4 py-3">
              <View className="h-9 w-9 rounded-lg bg-primary/15 items-center justify-center mr-3">
                <Text className="text-[13px] font-extrabold text-primary">#{row.id}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-foreground">{row.displayName}</Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Cost controller ID {row.id}
                </Text>
              </View>
              {idx !== controllers.length - 1 ? (
                <Separator className="absolute bottom-0 left-4 right-0" />
              ) : null}
            </View>
          ))}
        </Card>
      )}
    </>
  );
}

function StaffRow({
  member,
  last,
  onPress,
}: {
  member: StaffMember;
  last: boolean;
  onPress: () => void;
}) {
  const isAdmin = ["Admin", "Manager"].includes(member.Role);
  return (
    <Pressable
      className="flex-row items-center gap-3 px-4 py-3"
      onPress={onPress}
      disabled={isAdmin}
    >
      <Avatar text={initials(member.UserName)} color={isAdmin ? "#FBBF24" : "#2DD4BF"} />
      <View className="flex-1">
        <Text className="text-[15px] font-bold text-foreground">{member.UserName}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{roleLabel(member.Role)}</Text>
      </View>
      {member.loginDisabled ? (
        <Badge label="Disabled" fg="#F87171" bg="rgba(248, 113, 113, 0.14)" />
      ) : isAdmin ? (
        <Badge label="Admin" fg="#FBBF24" bg="rgba(251, 191, 36, 0.14)" />
      ) : (
        <Badge label="Active" fg="#4ADE80" bg="rgba(74, 222, 128, 0.14)" />
      )}
      {!isAdmin ? <Ionicons name="chevron-forward" size={16} color="#64748B" /> : null}
      {!last ? <Separator className="absolute bottom-0 left-4 right-0" /> : null}
    </Pressable>
  );
}

function CreateStaffModal({
  visible,
  tin,
  modules,
  onClose,
  onCreated,
}: {
  visible: boolean;
  tin: string | null;
  modules: string[] | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const filteredRoles = filterRolesForModules(modules);
  const defaultRole = filteredRoles[0]?.value ?? "Cashier";

  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setRole(filteredRoles[0]?.value ?? "Cashier");
    }
  }, [visible]);

  const reset = () => {
    setUserName("");
    setPassword("");
    setRole(defaultRole);
    setError(null);
  };

  const submit = async () => {
    if (!tin) return;
    if (!userName.trim() || password.length < 4) {
      setError("Enter a username and a password of at least 4 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createStaffRequest({ tinNumber: tin, UserName: userName, Password: password, Role: role });
      reset();
      onCreated();
    } catch (e: any) {
      setError(e?.message || "Could not create staff member.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      title="Add staff member"
      onClose={() => {
        reset();
        onClose();
      }}
    >
      <TextField
        label="Username"
        value={userName}
        onChangeText={setUserName}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="e.g. abel_cashier"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="min 4 characters"
      />
      <Text className="text-[13px] font-semibold text-muted-foreground">Role</Text>
      <View className="flex-row flex-wrap gap-2">
        {filteredRoles.map((r) => {
          const active = r.value === role;
          return (
            <Pressable
              key={r.value}
              onPress={() => setRole(r.value)}
              className={`px-3.5 py-2.5 rounded-full border ${
                active ? "bg-primary border-primary" : "bg-card border-border"
              }`}
            >
              <Text className={`text-[13px] font-semibold ${active ? "text-white" : "text-muted-foreground"}`}>
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text className="text-[13px] font-semibold text-destructive">{error}</Text> : null}

      <AppButton title="Create staff" onPress={submit} loading={loading} icon="checkmark" />
    </SheetModal>
  );
}

function StaffActionsModal({
  member,
  onClose,
  onChanged,
}: {
  member: StaffMember | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const alert = useAlert();
  const [mode, setMode] = useState<"menu" | "password">("menu");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (member) {
      setMode("menu");
      setPassword("");
      setError(null);
    }
  }, [member]);

  if (!member) return null;

  const toggleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await setStaffLoginDisabledRequest(member.id, !member.loginDisabled);
      onChanged();
    } catch (e: any) {
      setError(e?.message || "Action failed.");
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await setStaffPasswordRequest(member.id, password);
      alert("Password updated", `${member.UserName}'s password was changed.`, { variant: "success" });
      onChanged();
    } catch (e: any) {
      setError(e?.message || "Action failed.");
      setLoading(false);
    }
  };

  return (
    <SheetModal visible={!!member} title={member.UserName} onClose={onClose}>
      <Text className="text-xs text-muted-foreground mt-0.5">{roleLabel(member.Role)}</Text>

      {mode === "menu" ? (
        <View className="gap-2 mt-2">
          <AppButton
            title="Reset password"
            variant="secondary"
            icon="key-outline"
            onPress={() => setMode("password")}
          />
          <AppButton
            title={member.loginDisabled ? "Enable login" : "Disable login"}
            variant={member.loginDisabled ? "primary" : "danger"}
            icon={member.loginDisabled ? "lock-open-outline" : "lock-closed-outline"}
            loading={loading}
            onPress={toggleLogin}
          />
          {error ? <Text className="text-[13px] font-semibold text-destructive">{error}</Text> : null}
        </View>
      ) : (
        <View className="gap-3 mt-2">
          <TextField
            label="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="min 4 characters"
          />
          {error ? <Text className="text-[13px] font-semibold text-destructive">{error}</Text> : null}
          <AppButton title="Update password" onPress={resetPassword} loading={loading} icon="save-outline" />
          <AppButton title="Back" variant="ghost" onPress={() => setMode("menu")} />
        </View>
      )}
    </SheetModal>
  );
}

function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/60 justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-card rounded-t-2xl p-4 pb-8 gap-2">
          <View className="self-center w-10 h-1 rounded-full bg-border mb-2" />
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-extrabold text-foreground flex-1" numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 460 }}>
            <View className="gap-3">{children}</View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View className="flex-row items-center gap-2 bg-destructive/15 p-3 rounded-lg">
      <Ionicons name="alert-circle" size={16} color="#F87171" />
      <Text className="flex-1 text-[13px] font-semibold text-destructive">{message}</Text>
    </View>
  );
}
