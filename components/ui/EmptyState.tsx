import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { IconName } from "@/components/ui/icon";
import { colors, spacing } from "@/constants/theme";

type Props = { icon: IconName; title: string; message: string };

export default function EmptyState({ icon, title, message }: Props) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    borderStyle: "dashed",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 14, fontWeight: "800", color: colors.ink },
  message: { fontSize: 12, color: colors.inkSubdued, textAlign: "center", marginTop: 4 },
});
