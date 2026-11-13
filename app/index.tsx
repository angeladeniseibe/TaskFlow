import { useIsFocused } from "@react-navigation/native";
import { useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";

import AuthShell from "@/components/ui/AuthShell";
import IconInput from "@/components/ui/IconInput";
import Notice from "@/components/ui/Notice";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { goToDashboard } from "@/lib/navigation";
import { isValidEmail } from "@/lib/validation";

export default function LoginScreen() {
  const { signIn, isSignedIn, isLoading } = useAuth();
  const isFocused = useIsFocused();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Restoring the saved session on app start.
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  // Only while focused: Login stays mounted under the reset-password screen, and
  // the reset flow signs the user in before they've chosen a new password.
  if (isSignedIn && isFocused) return <Redirect href="/(tabs)/home" />;

  const handleLogin = async () => {
    if (isSubmitting) return; // guards double-submit from the keyboard "done" key
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("That email address doesn't look right.");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    const result = await signIn(email, password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    goToDashboard();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to keep your work moving.">
      <IconInput
        label="Email"
        icon="mail-outline"
        placeholder="you@university.edu"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />

      <IconInput
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="done"
        onSubmitEditing={handleLogin}
        right={
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Hide password" : "Show password"}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.inkFaint}
            />
          </Pressable>
        }
      />

      {error ? <Notice type="error" message={error} /> : null}

      <Pressable
        style={styles.forgotLink}
        onPress={() => {
          setError(null);
          router.push("/forgot-password");
        }}
        accessibilityRole="button"
      >
        <Text style={styles.forgotLinkText}>Forgot password?</Text>
      </Pressable>

      <PrimaryButton label="Log In" onPress={handleLogin} loading={isSubmitting} />

      <Text style={styles.footerText}>
        Don&apos;t have an account?{" "}
        <Text
          style={styles.linkText}
          onPress={() => router.push("/create-account")}
          accessibilityRole="link"
        >
          Create account
        </Text>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas },
  forgotLink: { alignSelf: "flex-end", marginBottom: spacing.lg, marginTop: -spacing.sm },
  forgotLinkText: { color: colors.primary, fontSize: 13, fontWeight: "600" },
  footerText: { textAlign: "center", marginTop: spacing.lg, color: colors.inkSubdued, fontSize: 13 },
  linkText: { color: colors.primary, fontWeight: "600" },
});
