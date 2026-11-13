import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radii } from "@/constants/theme";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: Props) {
  const inactive = loading || disabled;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && !inactive && styles.pressed,
        loading && styles.loading,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  pressed: { backgroundColor: colors.primaryHover },
  loading: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  text: { color: colors.white, fontSize: 16, fontWeight: "700" },
});
