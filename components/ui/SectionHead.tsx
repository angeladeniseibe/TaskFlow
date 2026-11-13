import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

type Props = { title: string; actionLabel?: string; onAction?: () => void };

export default function SectionHead({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} accessibilityRole="link">
          <Text style={styles.link}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9, marginTop: 6 },
  title: { fontSize: 15, fontWeight: "800", color: colors.ink },
  link: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
