import type { ReactNode, Ref } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { IconName } from "@/components/ui/icon";
import { colors, radii, spacing } from "@/constants/theme";

type Props = TextInputProps & {
  label: string;
  icon: IconName;
  /** Optional element on the right, e.g. a show/hide password toggle. */
  right?: ReactNode;
  ref?: Ref<TextInput>;
};

export default function IconInput({ label, icon, right, ref, ...inputProps }: Props) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.wrapper}>
        <Ionicons name={icon} size={18} color={colors.inkFaint} style={styles.icon} />
        <TextInput
          ref={ref}
          style={[styles.input, right ? styles.inputWithRight : null]}
          placeholderTextColor={colors.inkFaint}
          accessibilityLabel={label}
          {...inputProps}
        />
        {right}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSubdued,
    marginBottom: 6,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  icon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: 15, color: colors.ink, height: "100%" },
  inputWithRight: { marginRight: spacing.sm },
});
