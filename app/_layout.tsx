import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PortalHost } from "@rn-primitives/portal";
import "react-native-reanimated";
import "./global.css";

import { AuthProvider, useAuth } from "@/lib/auth";
import { AlertProvider } from "@/lib/alert";
import { PortfolioProvider, usePortfolio } from "@/lib/portfolio";

export const unstable_settings = {
  anchor: "(app)",
};

function OwnerNavigator() {
  const { owner, initializing } = useAuth();
  const { loading: portfolioLoading, selected } = usePortfolio();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;

    const route = segments[0];
    const inAuthGroup = route === "login";
    const inPaymentPortal = route === "payment-approval";

    if (!owner && !inAuthGroup) {
      router.replace("/login");
      return;
    }
    if (!owner || portfolioLoading) return;

    if (selected?.accessBlocked) {
      if (!inPaymentPortal) router.replace("/payment-approval");
    } else if (inAuthGroup || inPaymentPortal) {
      router.replace("/");
    }
  }, [owner, initializing, portfolioLoading, selected, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#0B1120" } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="payment-approval" />
        <Stack.Screen name="tenant-profile" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

function RootNavigator() {
  return (
    <PortfolioProvider>
      <OwnerNavigator />
    </PortfolioProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1 bg-background">
      <AuthProvider>
        <AlertProvider>
          <RootNavigator />
        </AlertProvider>
      </AuthProvider>
      <PortalHost />
    </GestureHandlerRootView>
  );
}
