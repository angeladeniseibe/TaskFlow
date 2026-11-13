import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import type { Priority } from "@/lib/tasks";

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: "URGENT",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

export const PRIORITY_COLORS: Record<Priority, { background: string; text: string }> = {
  urgent: { background: colors.dangerSoft, text: colors.dangerText },
  high: { background: colors.warningSoft, text: colors.warningText },
  medium: { background: colors.primarySoft, text: colors.primary },
  low: { background: colors.surfaceMuted, text: colors.inkSubdued },
};

export default function PriorityTag({ priority }: { priority: Priority }) {
  const { background, text } = PRIORITY_COLORS[priority];
  return (
    <View style={[styles.tag, { backgroundColor: background }]}>
      <Text style={[styles.text, { color: text }]}>{PRIORITY_LABEL[priority]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 9, fontWeight: "800", letterSpacing: 0.3 },
});
