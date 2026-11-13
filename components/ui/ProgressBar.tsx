import { StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

type Props = {
  /** 0-100. Values outside the range are clamped. */
  percent: number;
  height?: number;
};

export default function ProgressBar({ percent, height = 8 }: Props) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <View
      style={[styles.track, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
    >
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted,
    overflow: "hidden",
    marginVertical: 8,
  },
  fill: { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },
});
