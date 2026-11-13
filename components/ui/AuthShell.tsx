import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, shadow, spacing } from "@/constants/theme";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Small grey text under the card. */
  footnote?: string;
};

export default function AuthShell({ title, subtitle, children, footnote }: Props) {
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoMark}>
          <Ionicons name="grid" size={28} color={colors.white} />
        </View>
        <Text style={styles.brand}>TaskFlow</Text>
        <Text style={styles.brandSubtitle}>Academic Workspace</Text>

        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </View>

        {footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  brand: { fontSize: 24, fontWeight: "800", color: colors.ink, letterSpacing: -0.5 },
  brandSubtitle: {
    fontSize: 14,
    color: colors.inkSubdued,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: colors.inkSubdued, marginTop: 4, marginBottom: spacing.lg },
  footnote: {
    marginTop: spacing.lg,
    fontSize: 12,
    color: colors.inkFaint,
    textAlign: "center",
    maxWidth: 320,
  },
});
