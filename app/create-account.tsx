import { useRef, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import AuthShell from "@/components/ui/AuthShell";
import IconInput from "@/components/ui/IconInput";
import Notice from "@/components/ui/Notice";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { goToDashboard } from "@/lib/navigation";
import { isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/validation";

export default function CreateAccountScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const goToLoginScreen = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const handleCreateAccount = async () => {
    if (isSubmitting) return;
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Fill in all fields to create your account.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("That email address doesn't look right.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    const result = await signUp(fullName, email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    goToDashboard();
  };

  const passwordToggle = (
    <Pressable
      onPress={() => setShowPassword((v) => !v)}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={showPassword ? "Hide passwords" : "Show passwords"}
    >
      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={colors.inkFaint} />
    </Pressable>
  );

  return (
    <AuthShell title="Create your account" subtitle="Set up your account and start tracking work.">
      <IconInput
        label="Full name"
        icon="person-outline"
        placeholder="Maya Lin"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => emailRef.current?.focus()}
      />

      <IconInput
        ref={emailRef}
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
        placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => confirmRef.current?.focus()}
        right={passwordToggle}
      />

      <IconInput
        ref={confirmRef}
        label="Confirm password"
        icon="lock-closed-outline"
        placeholder="Re-enter your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showPassword}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleCreateAccount}
      />

      {error ? <Notice type="error" message={error} /> : null}

      <PrimaryButton label="Create Account" onPress={handleCreateAccount} loading={isSubmitting} />

      <Text style={styles.footerText}>
        Already have an account?{" "}
        <Text style={styles.linkText} onPress={goToLoginScreen} accessibilityRole="link">
          Log in
        </Text>
      </Text>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerText: { textAlign: "center", marginTop: spacing.md, color: colors.inkSubdued, fontSize: 13 },
  linkText: { color: colors.primary, fontWeight: "600" },
});
