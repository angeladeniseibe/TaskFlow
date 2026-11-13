import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import IconInput from "@/components/ui/IconInput";
import { colors, radii } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import type { Person } from "@/lib/tasks";

type Props = {
  /** People already on the task, hidden from the results. */
  excludeIds: string[];
  onPick: (person: Person) => void;
};

/** Search the accounts on this device by name or email and pick one to add. */
export default function MemberSearch({ excludeIds, onPick }: Props) {
  const { searchUsers } = useAuth();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = searchUsers(query).filter((p) => !excludeIds.includes(p.id));
  const showList = focused || query.length > 0;

  return (
    <View>
      <IconInput
        label="Search members by name"
        icon="search-outline"
        placeholder="Type a name or email"
        value={query}
        onChangeText={setQuery}
        onFocus={() => setFocused(true)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {showList ? (
        <View style={styles.list}>
          {results.length === 0 ? (
            <Text style={styles.empty}>
              {query ? "No account matches that name." : "No other accounts yet. Ask your teammates to sign up on this device."}
            </Text>
          ) : (
            results.map((p) => (
              <Pressable
                key={p.id}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}
                onPress={() => {
                  onPick(p);
                  setQuery("");
                  setFocused(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add ${p.fullName}`}
              >
                <View style={styles.avatar}>
                  <Text style={styles.initials}>{p.fullName.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{p.fullName}</Text>
                  <Text style={styles.email} numberOfLines={1}>{p.email}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: -8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 12, fontWeight: "800", color: colors.primary },
  name: { fontSize: 14, fontWeight: "700", color: colors.ink },
  email: { fontSize: 12, color: colors.inkSubdued },
  empty: { padding: 12, fontSize: 12, color: colors.inkSubdued },
});
