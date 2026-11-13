import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import PriorityTag from "@/components/ui/PriorityTag";
import ProgressBar from "@/components/ui/ProgressBar";
import { colors } from "@/constants/theme";
import { formatDue, isDone, isOverdue } from "@/lib/task-utils";
import type { Task } from "@/lib/tasks";

type Props = { task: Task; showProgress?: boolean };

export default function TaskCard({ task, showProgress = true }: Props) {
  const overdue = isOverdue(task);
  const done = isDone(task);
  const peopleCount = task.members.length + 1;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}, ${task.priority} priority, ${task.progress}% done, ${formatDue(task.dueDate)}`}
    >
      <View style={[styles.icon, done && { backgroundColor: colors.successSoft }]}>
        <Ionicons
          name={done ? "checkmark-circle" : "document-text-outline"}
          size={18}
          color={done ? colors.success : colors.primary}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
            {task.title}
          </Text>
          <PriorityTag priority={task.priority} />
        </View>
        {task.description ? (
          <Text style={styles.sub} numberOfLines={1}>
            {task.description}
          </Text>
        ) : null}
        {showProgress ? (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <ProgressBar percent={task.progress} height={6} />
            </View>
            <Text style={styles.percent}>{task.progress}%</Text>
          </View>
        ) : null}
        <View style={styles.meta}>
          <Ionicons
            name="time-outline"
            size={13}
            color={overdue ? colors.danger : colors.inkFaint}
          />
          <Text style={[styles.muted, overdue && { color: colors.dangerText, fontWeight: "700" }]}>
            {formatDue(task.dueDate)}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Ionicons name="people-outline" size={13} color={colors.inkFaint} />
          <Text style={styles.muted}>{peopleCount}</Text>
          {task.files.length > 0 ? (
            <>
              <Text style={styles.dot}>•</Text>
              <Ionicons name="attach-outline" size={13} color={colors.inkFaint} />
              <Text style={styles.muted}>{task.files.length}</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    gap: 10,
  },
  pressed: { opacity: 0.85 },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { flex: 1, fontSize: 14, fontWeight: "800", color: colors.ink },
  titleDone: { color: colors.inkFaint, textDecorationLine: "line-through" },
  sub: { fontSize: 12, color: colors.inkSubdued, marginTop: 3 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  progressBar: { flex: 1 },
  percent: { fontSize: 11, fontWeight: "700", color: colors.inkSubdued, width: 34, textAlign: "right" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  muted: { fontSize: 11, color: colors.inkSubdued },
  dot: { color: colors.inkFaint, fontSize: 10 },
});
