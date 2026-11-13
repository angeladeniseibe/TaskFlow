import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing } from "@/constants/theme";

type Props = { type: "error" | "success"; message: string };

export default function Notice({ type, message }: Props) {
  const isError = type === "error";

  return (
    <View
      style={[styles.box, { backgroundColor: isError ? colors.dangerSoft : colors.successSoft }]}
      accessibilityRole="alert"
    >
      <Ionicons
        name={isError ? "alert-circle" : "checkmark-circle"}
        size={16}
        color={isError ? colors.danger : colors.success}
      />
      <Text style={[styles.text, { color: isError ? colors.dangerText : colors.successText }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: spacing.md,
  },
  text: { fontSize: 13, flexShrink: 1 },
});
