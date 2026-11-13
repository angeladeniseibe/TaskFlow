import { useRef, useState } from "react";
import {
  Alert,
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
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import IconInput from "@/components/ui/IconInput";
import Notice from "@/components/ui/Notice";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { colors, radii, shadow, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { goToLogin } from "@/lib/navigation";
import { isValidPhone, normalizeName } from "@/lib/validation";

type Feedback = { type: "error" | "success"; message: string };

export default function ProfileScreen() {
  const { isSignedIn } = useAuth();

  // Not signed in (e.g. app reloaded or just logged out): back to Login.
  if (!isSignedIn) return <Redirect href="/" />;

  return <ProfileForm />;
}

function ProfileForm() {
  const { user, updateProfile, signOut } = useAuth();

  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [school, setSchool] = useState(user.school);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const schoolRef = useRef<TextInput>(null);

  const isDirty =
    normalizeName(fullName) !== user.fullName ||
    phone.trim() !== user.phone ||
    school.trim() !== user.school;

  // Any edit clears an earlier error / "saved" message.
  const edit = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setFeedback(null);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setFeedback(null);

    const cleanName = normalizeName(fullName);
    if (!cleanName) {
      setFeedback({ type: "error", message: "Your name can't be empty." });
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setFeedback({ type: "error", message: "That phone number doesn't look right." });
      return;
    }

    setIsSaving(true);
    const result = await updateProfile({ fullName: cleanName, phone, school });
    setIsSaving(false);
    if (!result.ok) {
      setFeedback({ type: "error", message: result.error });
      return;
    }

    Keyboard.dismiss();
    setFullName(cleanName);
    setPhone(phone.trim());
    setSchool(school.trim());
    setFeedback({ type: "success", message: "Profile updated." });
  };

  const logOut = () => {
    // Leave the app screens first so nothing re-renders against a signed-out user.
    goToLogin();
    void signOut();
  };

  const confirmLogOut = () => {
    // Alert.alert is a no-op on web, so log out directly there.
    if (Platform.OS === "web") {
      logOut();
      return;
    }
    Alert.alert("Log out", "You'll need to log in again to see your tasks.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logOut },
    ]);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            onPress={goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <ScreenHeader kicker="YOUR ACCOUNT" title="Profile" marginBottom={16} showAvatar={false} />

          <View style={styles.summary}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>{user.initials}</Text>
            </View>
            <Text style={styles.summaryName}>{user.fullName}</Text>
            <Text style={styles.summaryEmail}>{user.email || "No email set"}</Text>
            {user.school ? <Text style={styles.summarySchool}>{user.school}</Text> : null}
          </View>

          <Text style={styles.sectionTitle} accessibilityRole="header">
            Personal information
          </Text>
          <View style={styles.card}>
            <IconInput
              label="Full name"
              icon="person-outline"
              placeholder="Your full name"
              value={fullName}
              onChangeText={edit(setFullName)}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <IconInput
              label="Email (can't be changed)"
              icon="mail-outline"
              value={user.email}
              editable={false}
              selectTextOnFocus={false}
            />
            <IconInput
              ref={phoneRef}
              label="Phone (optional)"
              icon="call-outline"
              placeholder="+63 900 000 0000"
              value={phone}
              onChangeText={edit(setPhone)}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => schoolRef.current?.focus()}
            />
            <IconInput
              ref={schoolRef}
              label="School (optional)"
              icon="school-outline"
              placeholder="Your university"
              value={school}
              onChangeText={edit(setSchool)}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />

            {feedback ? <Notice type={feedback.type} message={feedback.message} /> : null}

            <PrimaryButton label="Save changes" onPress={handleSave} disabled={!isDirty} loading={isSaving} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
            onPress={confirmLogOut}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.dangerText} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginBottom: spacing.md,
  },
  backText: { fontSize: 14, fontWeight: "600", color: colors.ink },
  summary: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: spacing.lg,
    marginBottom: 18,
  },
  bigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.avatar,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  bigAvatarText: { fontSize: 26, fontWeight: "800", color: colors.primary },
  summaryName: { fontSize: 18, fontWeight: "800", color: colors.ink },
  summaryEmail: { fontSize: 13, color: colors.inkSubdued, marginTop: 2 },
  summarySchool: { fontSize: 12, color: colors.inkFaint, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, marginBottom: 9 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    marginTop: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.white,
  },
  logoutPressed: { backgroundColor: colors.dangerSoft },
  logoutText: { fontSize: 16, fontWeight: "700", color: colors.dangerText },
});
