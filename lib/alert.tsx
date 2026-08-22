import React, { createContext, useCallback, useContext, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AlertVariant = "success" | "warning" | "destructive" | "info";

type AlertOptions = {
  variant?: AlertVariant;
  buttons?: AlertButton[];
};

type AlertFn = (title: string, message?: string, options?: AlertOptions) => void;

const VARIANT_CONFIG: Record<AlertVariant, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: "checkmark-circle", color: "#4ADE80", bg: "rgba(74, 222, 128, 0.15)" },
  warning: { icon: "warning", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)" },
  destructive: { icon: "alert-circle", color: "#F87171", bg: "rgba(248, 113, 113, 0.15)" },
  info: { icon: "information-circle", color: "#60A5FA", bg: "rgba(96, 165, 250, 0.15)" },
};

const AlertContext = createContext<AlertFn>(() => {});

export function useAlert(): AlertFn {
  return useContext(AlertContext);
}

type AlertState = {
  open: boolean;
  title: string;
  message: string;
  variant: AlertVariant;
  buttons: AlertButton[];
};

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AlertState>({
    open: false,
    title: "",
    message: "",
    variant: "info",
    buttons: [],
  });

  const show: AlertFn = useCallback((title, message, options) => {
    setState({
      open: true,
      title,
      message: message ?? "",
      variant: options?.variant ?? "info",
      buttons: options?.buttons ?? [{ text: "OK" }],
    });
  }, []);

  const close = useCallback(() => {
    setState((s) => ({ ...s, open: false }));
  }, []);

  const cfg = VARIANT_CONFIG[state.variant];
  const cancelBtn = state.buttons.find((b) => b.style === "cancel");
  const actionButtons = state.buttons.filter((b) => b.style !== "cancel");

  return (
    <AlertContext.Provider value={show}>
      {children}
      <AlertDialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <View className="items-center mb-1">
              <View
                className="h-12 w-12 rounded-full items-center justify-center"
                style={{ backgroundColor: cfg.bg }}
              >
                <Ionicons name={cfg.icon} size={26} color={cfg.color} />
              </View>
            </View>
            <AlertDialogTitle className="text-center">{state.title}</AlertDialogTitle>
            {state.message ? (
              <AlertDialogDescription className="text-center">
                {state.message}
              </AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {cancelBtn ? (
              <AlertDialogCancel
                onPress={() => {
                  cancelBtn.onPress?.();
                  close();
                }}
              >
                <Text>{cancelBtn.text}</Text>
              </AlertDialogCancel>
            ) : null}
            {actionButtons.map((btn, i) => (
              <AlertDialogAction
                key={i}
                className={btn.style === "destructive" ? "bg-destructive" : undefined}
                onPress={() => {
                  btn.onPress?.();
                  close();
                }}
              >
                <Text>{btn.text}</Text>
              </AlertDialogAction>
            ))}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}
