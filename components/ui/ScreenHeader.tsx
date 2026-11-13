import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import Avatar from "./Avatar";

type Props = {
  kicker: string;
  title: string;
  // Each screen historically used slightly different values here; they are
  // props so every screen keeps its exact original look.
  kickerLetterSpacing?: number;
  titleFontSize?: number;
  marginBottom?: number;
  showAvatar?: boolean;
};

export default function ScreenHeader({
  kicker,
  title,
  kickerLetterSpacing = 1,
  titleFontSize = 21,
  marginBottom = 0,
  showAvatar = true,
}: Props) {
  return (
    <View style={[styles.row, { marginBottom }]}>
      <View>
        <Text style={[styles.kicker, { letterSpacing: kickerLetterSpacing }]}>
          {kicker}
        </Text>
        <Text
          style={[styles.title, { fontSize: titleFontSize }]}
          accessibilityRole="header"
        >
          {title}
        </Text>
      </View>
      {showAvatar ? <Avatar /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  kicker: { fontSize: 9, fontWeight: "800", color: colors.primary },
  title: { fontWeight: "800", color: colors.ink, marginTop: 4 },
});
