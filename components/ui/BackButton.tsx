import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors, spacing } from "@/constants/theme";

export default function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/home"))}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={18} color={colors.ink} />
      <Text style={styles.text}>Back</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, marginBottom: spacing.md },
  text: { fontSize: 14, fontWeight: "600", color: colors.ink },
});
