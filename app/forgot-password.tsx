import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import IconInput from "@/components/ui/IconInput";
import Notice from "@/components/ui/Notice";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, radii, shadow, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { goToDashboard } from "@/lib/navigation";
import { cleanCode, isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/validation";

type Step = "email" | "code" | "password";

const RESEND_COOLDOWN_S = 10;

const COPY: Record<Step, { icon: keyof typeof Ionicons.glyphMap; title: string }> = {
  email: { icon: "key-outline", title: "Forgot password" },
  code: { icon: "mail-open-outline", title: "Enter your code" },
  password: { icon: "lock-closed-outline", title: "New password" },
};

export default function ForgotPasswordScreen() {
  const { requestPasswordReset, verifyResetCode, setNewPassword } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (isSubmitting) return;
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Enter your email address to reset your password.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("That email address doesn't look right.");
      return;
    }

    Keyboard.dismiss();
    setIsSubmitting(true);
    const result = await requestPasswordReset(email);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setCode("");
    setInfo(`No email server is connected, so here is your code: ${result.code}`);
    setStep("code");
    setCooldown(RESEND_COOLDOWN_S);
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError(null);
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setInfo(`Your new code: ${result.code}`);
    setCooldown(RESEND_COOLDOWN_S);
  };

  const checkCode = async () => {
    if (isSubmitting) return;
    setError(null);
    setInfo(null);
    if (cleanCode(code).length < 6) {
      setError("Enter the code from your email.");
      return;
    }
    Keyboard.dismiss();
    setIsSubmitting(true);
    const result = await verifyResetCode(email, code);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStep("password");
  };

  const savePassword = async () => {
    if (isSubmitting) return;
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    Keyboard.dismiss();
    setIsSubmitting(true);
    const result = await setNewPassword(password);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    goToDashboard(); // the verified code already signed them in
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const { icon, title } = COPY[step];
  const subtitle =
    step === "email"
      ? "Enter your account email and we'll create a reset code."
      : step === "code"
        ? `Enter the 6-digit code for ${email.trim()}. It expires in 10 minutes.`
        : "Code accepted. Choose a new password for your account.";

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={step === "email" || step === "password" ? goBack : () => setStep("email")}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={18} color={colors.ink} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.logoMark}>
          <Ionicons name={icon} size={24} color={colors.white} />
        </View>

        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.card}>
          {step === "email" ? (
            <>
              <IconInput
                label="Email"
                icon="mail-outline"
                placeholder="you@university.edu"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={sendCode}
              />
              {error ? <Notice type="error" message={error} /> : null}
              <PrimaryButton label="Get reset code" onPress={sendCode} loading={isSubmitting} />
            </>
          ) : null}

          {step === "code" ? (
            <>
              <IconInput
                label="Code"
                icon="keypad-outline"
                placeholder="6-digit code"
                value={code}
                onChangeText={(v) => {
                  setCode(cleanCode(v));
                  setError(null);
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="done"
                onSubmitEditing={checkCode}
              />
              {error ? <Notice type="error" message={error} /> : null}
              {info ? <Notice type="success" message={info} /> : null}
              <PrimaryButton label="Verify code" onPress={checkCode} loading={isSubmitting} />
              <Text style={styles.footerText}>
                Need a new code?{" "}
                <Text
                  style={cooldown > 0 ? styles.disabledLink : styles.linkText}
                  onPress={resend}
                  accessibilityRole="link"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </Text>
              </Text>
            </>
          ) : null}

          {step === "password" ? (
            <>
              <IconInput
                label="New password"
                icon="lock-closed-outline"
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => confirmRef.current?.focus()}
                right={
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? "Hide passwords" : "Show passwords"}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color={colors.inkFaint}
                    />
                  </Pressable>
                }
              />
              <IconInput
                ref={confirmRef}
                label="Confirm new password"
                icon="lock-closed-outline"
                placeholder="Re-enter your password"
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                textContentType="newPassword"
                returnKeyType="done"
                onSubmitEditing={savePassword}
              />
              {error ? <Notice type="error" message={error} /> : null}
              <PrimaryButton label="Save password & log in" onPress={savePassword} loading={isSubmitting} />
            </>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", marginBottom: spacing.lg, gap: 6 },
  backText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    alignSelf: "center",
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: colors.inkSubdued, textAlign: "center", marginTop: 6, marginBottom: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignSelf: "center",
    ...shadow.card,
  },
  footerText: { textAlign: "center", marginTop: spacing.md, color: colors.inkSubdued, fontSize: 13 },
  linkText: { color: colors.primary, fontWeight: "600" },
  disabledLink: { color: colors.inkFaint, fontWeight: "600" },
});
