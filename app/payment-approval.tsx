import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HOTCOL_CBE_ACCOUNT } from "@/constants/config";
import { PropertyPicker } from "@/components/property-picker";
import { AppButton, Badge, Card, EmptyState, Loading, Row, TextField } from "@/components/ui";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/lib/auth";
import { formatDate, formatDateTime, formatETB } from "@/lib/format";
import { usePortfolio } from "@/lib/portfolio";
import {
  fetchPropertyDashboard,
  fetchPropertyPayments,
  submitSubscriptionPaymentRequest,
} from "@/lib/queries";
import { statusTone } from "@/lib/theme";
import { useAlert } from "@/lib/alert";
import { usePropertyData } from "@/lib/use-property-data";

export default function PaymentApprovalScreen() {
  const { signOut } = useAuth();
  const portfolio = usePortfolio();
  const dashboard = usePropertyData(fetchPropertyDashboard);
  const payments = usePropertyData(fetchPropertyPayments);
  const [channel, setChannel] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alert = useAlert();

  const selected = portfolio.selected;
  const billing = dashboard.data?.billing ?? null;
  const needsSetup = Boolean(
    billing && !billing.setupFeeApproved && billing.setupFeeETB > 0,
  );
  const paymentKind = needsSetup ? "setup" : billing?.renewalKind ?? "quarterly";
  const amountETB = needsSetup
    ? billing?.setupFeeETB ?? 0
    : billing?.renewalAmountETB ?? 0;
  const pending = Boolean(billing?.pendingPaymentKind);
  const blockedStatus =
    selected?.accountStatus === "suspended" || selected?.accountStatus === "banned"
      ? selected.accountStatus
      : selected?.subscriptionStatus ?? "expired";
  const tone = statusTone(blockedStatus);

  const refresh = async () => {
    await Promise.all([dashboard.refresh(), payments.refresh(), portfolio.refresh()]);
  };

  const submit = async () => {
    if (!selected || !billing) return;
    if (!channel.trim() || !reference.trim()) {
      setError("Enter the payment channel and transaction reference.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitSubscriptionPaymentRequest({
        tinNumber: selected.tinNumber,
        paymentKind,
        paymentChannel: channel.trim(),
        transactionRef: reference.trim(),
      });
      setChannel("");
      setReference("");
      alert(
        "Payment submitted",
        "HotCol will verify the reference. Operational access remains locked until approval.",
        { variant: "success" },
      );
      await refresh();
    } catch (cause: any) {
      setError(cause?.message || "Could not submit payment for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  if (portfolio.loading || (dashboard.loading && !dashboard.data)) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Loading label="Opening payment verification…" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 pb-8 gap-4"
          refreshControl={
            <RefreshControl
              refreshing={dashboard.refreshing || payments.refreshing}
              onRefresh={refresh}
              tintColor="#2DD4BF"
            />
          }
        >
          <View className="items-center gap-3 pt-5 pb-1">
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-warning-soft">
              <Ionicons name="shield-checkmark-outline" size={32} color="#FBBF24" />
            </View>
            <Text className="text-2xl font-extrabold text-foreground">
              Payment verification
            </Text>
            <Text className="text-center text-sm leading-5 text-muted-foreground px-3">
              Complete payment approval to unlock your owner operations and reports.
            </Text>
            <PropertyPicker />
          </View>

          {!selected ? (
            <Card>
              <EmptyState
                icon="business-outline"
                title="No property linked"
                subtitle="Contact HotCol support to link a property to this owner account."
              />
            </Card>
          ) : (
            <>
              <Card className="gap-3 border-warning/40">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-lg font-extrabold text-foreground">
                      {selected.hotelDisplayName}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-1">
                      TIN {selected.tinNumber}
                    </Text>
                  </View>
                  <Badge label={tone.label} fg={tone.fg} bg={tone.bg} />
                </View>
                <View className="rounded-lg bg-warning-soft p-3 flex-row gap-2">
                  <Ionicons name="lock-closed" size={17} color="#FBBF24" />
                  <Text className="flex-1 text-[13px] leading-5 font-semibold text-warning">
                    {dashboard.data?.accessBlockReason ||
                      selected.accessBlockReason ||
                      "Operational access is currently locked."}
                  </Text>
                </View>
              </Card>

              {billing ? (
                <Card className="gap-2">
                  <Text className="text-base font-extrabold text-foreground">
                    Amount due
                  </Text>
                  <Text className="text-3xl font-extrabold text-primary">
                    {formatETB(amountETB)}
                  </Text>
                  <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {paymentKind} payment
                  </Text>
                  <View className="h-px bg-border my-1" />
                  <Row label="CBE account" value={HOTCOL_CBE_ACCOUNT} />
                  <Row
                    label="Paid until"
                    value={
                      billing.subscriptionPaidUntil
                        ? formatDate(billing.subscriptionPaidUntil)
                        : "—"
                    }
                  />
                  {billing.freeTrialEndsAt ? (
                    <Row label="Trial ended" value={formatDate(billing.freeTrialEndsAt)} />
                  ) : null}
                </Card>
              ) : null}

              <Card className="gap-4">
                <View>
                  <Text className="text-base font-extrabold text-foreground">
                    Submit transfer reference
                  </Text>
                  <Text className="text-[13px] leading-5 text-muted-foreground mt-1">
                    Transfer to the account above, then enter the channel and receipt
                    reference for HotCol approval.
                  </Text>
                </View>
                {pending ? (
                  <View className="rounded-lg bg-warning-soft p-3 flex-row gap-2">
                    <Ionicons name="hourglass-outline" size={17} color="#FBBF24" />
                    <Text className="flex-1 text-[13px] font-semibold text-warning">
                      Your {billing?.pendingPaymentKind} payment is awaiting approval.
                      Pull down to refresh its status.
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextField
                      label="Payment channel"
                      value={channel}
                      onChangeText={setChannel}
                      placeholder="CBE, Telebirr, bank transfer…"
                    />
                    <TextField
                      label="Transaction reference"
                      value={reference}
                      onChangeText={setReference}
                      autoCapitalize="characters"
                      placeholder="Receipt or transaction number"
                    />
                    {error ? (
                      <Text className="text-[13px] font-semibold text-destructive">
                        {error}
                      </Text>
                    ) : null}
                    <AppButton
                      title="Submit for approval"
                      icon="cloud-upload-outline"
                      loading={submitting}
                      onPress={submit}
                    />
                  </>
                )}
              </Card>

              {(payments.data?.length ?? 0) > 0 ? (
                <Card className="gap-3">
                  <Text className="text-base font-extrabold text-foreground">
                    Recent submissions
                  </Text>
                  {payments.data!.slice(0, 5).map((payment) => {
                    const paymentTone = statusTone(
                      payment.status === "approved" ? "active" : payment.status,
                    );
                    return (
                      <View
                        key={payment.id}
                        className="flex-row items-center gap-3 border-t border-border pt-3"
                      >
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-foreground">
                            {formatETB(payment.amountETB)} · {payment.paymentChannel}
                          </Text>
                          <Text className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(payment.submittedAt)} · {payment.transactionRef}
                          </Text>
                        </View>
                        <Badge
                          label={capitalize(payment.status)}
                          fg={paymentTone.fg}
                          bg={paymentTone.bg}
                        />
                      </View>
                    );
                  })}
                </Card>
              ) : null}
            </>
          )}

          <AppButton
            title="Sign out"
            icon="log-out-outline"
            variant="ghost"
            onPress={() => void signOut()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function capitalize(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
