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
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@/components/screen-header";
import {
  AppButton,
  Avatar,
  Badge,
  Card,
  EmptyState,
  Loading,
  Row,
  SectionHeader,
  TextField,
} from "@/components/ui";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/portfolio";
import { usePropertyData } from "@/lib/use-property-data";
import {
  changeOwnerPasswordRequest,
  fetchPropertyDashboard,
  fetchPropertyPayments,
  submitSubscriptionPaymentRequest,
} from "@/lib/queries";
import { useAlert } from "@/lib/alert";
import { statusTone } from "@/lib/theme";
import { formatDate, formatDateTime, formatETB, initials } from "@/lib/format";
import type { BillingInfo } from "@/lib/types";

export default function MoreScreen() {
  const router = useRouter();
  const { owner, signOut } = useAuth();
  const { selected } = usePortfolio();
  const dashboard = usePropertyData(fetchPropertyDashboard);
  const payments = usePropertyData(fetchPropertyPayments);
  const [showPay, setShowPay] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const billing = dashboard.data?.billing ?? null;

  const onRefresh = async () => {
    await Promise.all([dashboard.refresh(), payments.refresh()]);
  };

  const alert = useAlert();

  const confirmLogout = () => {
    alert("Sign out", "Are you sure you want to sign out?", {
      variant: "destructive",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: () => void signOut() },
      ],
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScreenHeader title="More" />
      <ScrollView
        contentContainerClassName="px-4 gap-3 pb-4"
        refreshControl={
          <RefreshControl
            refreshing={dashboard.refreshing || payments.refreshing}
            onRefresh={onRefresh}
            tintColor="#2DD4BF"
          />
        }
      >
        <Card className="flex-row items-center gap-3">
          <Avatar text={initials(owner?.displayName || owner?.UserName)} />
          <View className="flex-1">
            <Text className="text-[17px] font-extrabold text-foreground">
              {owner?.displayName || owner?.UserName}
            </Text>
            <Text className="text-[13px] text-muted-foreground mt-0.5">
              @{owner?.UserName} · {owner?.propertyCount ?? 0} propert
              {(owner?.propertyCount ?? 0) === 1 ? "y" : "ies"}
            </Text>
          </View>
        </Card>

        <SectionHeader title="Subscription & billing" />
        {!selected ? (
          <Card>
            <EmptyState icon="business-outline" title="No property selected" />
          </Card>
        ) : dashboard.loading && !billing ? (
          <Card>
            <Loading label="Loading billing…" />
          </Card>
        ) : billing ? (
          <BillingCard
            billing={billing}
            propertyName={selected.hotelDisplayName}
            onSubmit={() => setShowPay(true)}
          />
        ) : null}

        {selected ? (
          <>
            <SectionHeader title="Payment history" />
            {(payments.data?.length ?? 0) === 0 ? (
              <Card>
                <EmptyState icon="card-outline" title="No payments submitted yet" />
              </Card>
            ) : (
              <Card padded={false}>
                {payments.data!.map((p, idx) => {
                  const tone = statusTone(p.status === "approved" ? "active" : p.status);
                  return (
                    <View key={p.id} className="flex-row items-center gap-2 px-4 py-3">
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground">
                          {capitalize(p.paymentKind)} · {formatETB(p.amountETB)}
                        </Text>
                        <Text className="text-xs text-muted-foreground mt-0.5">
                          {p.paymentChannel} · {formatDateTime(p.submittedAt)}
                        </Text>
                        {p.rejectionReason ? (
                          <Text className="text-xs text-destructive mt-0.5">{p.rejectionReason}</Text>
                        ) : null}
                      </View>
                      <Badge
                        label={p.status === "approved" ? "Approved" : capitalize(p.status)}
                        fg={tone.fg}
                        bg={tone.bg}
                      />
                      {idx !== payments.data!.length - 1 ? (
                        <Separator className="absolute bottom-0 left-4 right-0" />
                      ) : null}
                    </View>
                  );
                })}
              </Card>
            )}
          </>
        ) : null}

        <SectionHeader title="Property" />
        <Card padded={false}>
          <MenuItem
            icon="cube-outline"
            label="Request modules"
            onPress={() => router.push("/tenant-profile")}
          />
        </Card>

        <SectionHeader title="Account" />
        <Card padded={false}>
          <MenuItem
            icon="key-outline"
            label="Change password"
            onPress={() => setShowPassword(true)}
          />
          <Separator className="ml-4" />
          <MenuItem
            icon="log-out-outline"
            label="Sign out"
            danger
            onPress={confirmLogout}
          />
        </Card>

        <Text className="text-center text-xs text-text-faint mt-2">
          HotCol Owner v{Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
        <View className="h-6" />
      </ScrollView>

      <SubmitPaymentModal
        visible={showPay}
        tin={selected?.tinNumber ?? null}
        billing={billing}
        onClose={() => setShowPay(false)}
        onDone={() => {
          setShowPay(false);
          void dashboard.refresh();
          void payments.refresh();
        }}
      />

      <ChangePasswordModal visible={showPassword} onClose={() => setShowPassword(false)} />
    </SafeAreaView>
  );
}

function BillingCard({
  billing,
  propertyName,
  onSubmit,
}: {
  billing: BillingInfo;
  propertyName: string;
  onSubmit: () => void;
}) {
  const tone = statusTone(billing.subscriptionStatus);
  const needsSetup = !billing.setupFeeApproved && billing.setupFeeETB > 0;
  const canPay = !billing.isIllustrationTenant;

  return (
    <Card className="gap-2">
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-base font-extrabold text-foreground flex-1" numberOfLines={1}>
          {propertyName}
        </Text>
        <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
      </View>

      {billing.isIllustrationTenant ? (
        <Text className="text-[13px] text-muted-foreground">
          This is a demo / illustration property — no billing applies.
        </Text>
      ) : (
        <>
          <Row label="Setup fee" value={formatETB(billing.setupFeeETB)} />
          <Row
            label={billing.renewalKind === "yearly" ? "Yearly fee" : "Quarterly fee"}
            value={formatETB(billing.renewalAmountETB)}
          />
          <Row
            label="Paid until"
            value={billing.subscriptionPaidUntil ? formatDate(billing.subscriptionPaidUntil) : "—"}
          />
          {billing.freeTrialEndsAt ? (
            <Row label="Free trial ends" value={formatDate(billing.freeTrialEndsAt)} />
          ) : null}
          {billing.pendingPaymentKind ? (
            <View className="flex-row items-center gap-2 bg-warning-soft p-3 rounded-lg mt-1">
              <Ionicons name="hourglass-outline" size={15} color="#FBBF24" />
              <Text className="flex-1 text-[13px] font-semibold text-warning">
                A {billing.pendingPaymentKind} payment is awaiting HotCol approval.
              </Text>
            </View>
          ) : null}
        </>
      )}

      {canPay ? (
        <AppButton
          title={needsSetup ? "Submit setup payment" : "Submit subscription payment"}
          icon="cloud-upload-outline"
          onPress={onSubmit}
          className="mt-1"
        />
      ) : null}
    </Card>
  );
}

function SubmitPaymentModal({
  visible,
  tin,
  billing,
  onClose,
  onDone,
}: {
  visible: boolean;
  tin: string | null;
  billing: BillingInfo | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const alert = useAlert();
  const [channel, setChannel] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSetup = !!billing && !billing.setupFeeApproved && billing.setupFeeETB > 0;
  const kind = needsSetup ? "setup" : billing?.renewalKind ?? "quarterly";
  const amount = needsSetup ? billing?.setupFeeETB ?? 0 : billing?.renewalAmountETB ?? 0;

  const submit = async () => {
    if (!tin) return;
    if (!channel.trim() || !ref.trim()) {
      setError("Enter the payment channel and transaction reference.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitSubscriptionPaymentRequest({
        tinNumber: tin,
        paymentKind: kind,
        paymentChannel: channel.trim(),
        transactionRef: ref.trim(),
      });
      setChannel("");
      setRef("");
      alert("Submitted", "Your payment was submitted for HotCol approval.", { variant: "success" });
      onDone();
    } catch (e: any) {
      setError(e?.message || "Could not submit payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetModal visible={visible} title="Submit payment" onClose={onClose}>
      <View className="bg-primary/15 rounded-lg p-4 items-center gap-1">
        <Text className="text-primary font-semibold text-[13px]">{capitalize(kind)} payment</Text>
        <Text className="text-primary font-extrabold text-2xl">{formatETB(amount)}</Text>
      </View>
      <TextField
        label="Payment channel"
        value={channel}
        onChangeText={setChannel}
        placeholder="e.g. CBE, Telebirr, Bank transfer"
      />
      <TextField
        label="Transaction reference"
        value={ref}
        onChangeText={setRef}
        autoCapitalize="characters"
        placeholder="Reference / receipt no."
      />
      {error ? <Text className="text-[13px] font-semibold text-destructive">{error}</Text> : null}
      <AppButton title="Submit for approval" onPress={submit} loading={loading} icon="checkmark" />
    </SheetModal>
  );
}

function ChangePasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const alert = useAlert();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!current || next.length < 6) {
      setError("Enter your current password and a new password (min 6 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await changeOwnerPasswordRequest(current, next);
      setCurrent("");
      setNext("");
      alert("Done", "Your password was updated.", { variant: "success" });
      onClose();
    } catch (e: any) {
      setError(e?.message || "Could not change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SheetModal visible={visible} title="Change password" onClose={onClose}>
      <TextField
        label="Current password"
        value={current}
        onChangeText={setCurrent}
        secureTextEntry
      />
      <TextField
        label="New password"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        placeholder="min 6 characters"
      />
      {error ? <Text className="text-[13px] font-semibold text-destructive">{error}</Text> : null}
      <AppButton title="Update password" onPress={submit} loading={loading} icon="save-outline" />
    </SheetModal>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable className="flex-row items-center gap-3 px-4 py-4" onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? "#F87171" : "#94A3B8"} />
      <Text className={`flex-1 text-[15px] font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#64748B" />
    </Pressable>
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

function capitalize(s: string) {
  const v = String(s || "");
  return v.charAt(0).toUpperCase() + v.slice(1);
}
