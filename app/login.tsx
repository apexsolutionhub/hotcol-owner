import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { AppButton, TextField } from "@/components/ui";
import { Text } from "@/components/ui/text";

export default function Login() {
  const { owner, initializing, signIn } = useAuth();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!initializing && owner) return <Redirect href="/" />;

  const onSubmit = async () => {
    if (!userName.trim() || !password) {
      setError("Enter your username and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(userName, password);
    } catch (e: any) {
      setError(e?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center p-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center gap-2">
            <View className="w-[68px] h-[68px] rounded-2xl bg-primary items-center justify-center mb-1">
              <Ionicons name="storefront" size={30} color="#FFFFFF" />
            </View>
            <Text className="text-[26px] font-extrabold text-foreground">HotCol Owner</Text>
            <Text className="text-sm text-muted-foreground text-center px-4">
              Monitor your cafés and hotels in one place.
            </Text>
          </View>

          <View className="bg-card rounded-2xl border border-border p-6 gap-4">
            <Text className="text-lg font-extrabold text-foreground">Sign in</Text>

            <TextField
              label="Username"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="owner username"
              returnKeyType="next"
            />

            <View className="gap-1.5">
              <Text className="text-[13px] font-semibold text-muted-foreground">Password</Text>
              <View className="h-[50px] flex-row items-center border border-border rounded-lg bg-card px-3">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  className="flex-1 h-full text-[15px] text-foreground"
                  onSubmitEditing={onSubmit}
                  returnKeyType="go"
                />
                <Pressable
                  onPress={() => setShowPassword((s) => !s)}
                  hitSlop={10}
                  className="pl-2"
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#94A3B8"
                  />
                </Pressable>
              </View>
            </View>

            {error ? (
              <View className="flex-row items-center gap-2 bg-destructive/15 p-3 rounded-lg">
                <Ionicons name="alert-circle" size={16} color="#F87171" />
                <Text className="flex-1 text-[13px] font-semibold text-destructive">{error}</Text>
              </View>
            ) : null}

            <AppButton
              title="Sign in"
              onPress={onSubmit}
              loading={loading}
              icon="log-in-outline"
            />
          </View>

          <Text className="text-xs text-text-faint text-center px-4">
            Owner access is provisioned by HotCol. Contact support if you cannot
            sign in.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
