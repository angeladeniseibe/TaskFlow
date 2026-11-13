import { Pressable, StyleSheet, Text } from "react-native";
import { router } from "expo-router";

import { colors } from "@/constants/theme";
import { useAuth } from "@/lib/auth";

export default function Avatar() {
  const { user } = useAuth();

  return (
    <Pressable
      style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
      onPress={() => router.push("/profile")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Open profile for ${user.fullName}`}
    >
      <Text style={styles.text}>{user.initials.charAt(0)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
  text: { fontWeight: "800", color: colors.primary },
});
