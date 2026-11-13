import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/ui/EmptyState";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TaskCard from "@/components/ui/TaskCard";
import { colors, spacing } from "@/constants/theme";
import { daysUntil, isDone, PRIORITY_WEIGHT, sortByDeadline } from "@/lib/task-utils";
import { useTasks, type Task } from "@/lib/tasks";

type Group = { key: string; title: string; tone?: "danger"; tasks: Task[] };

export default function DeadlinesScreen() {
  const { tasks, isLoading, refresh } = useTasks();

  const open = sortByDeadline(
    tasks.filter((t) => !isDone(t)),
  ).sort((a, b) => {
    // Same day: higher priority first.
    if (a.dueDate && a.dueDate === b.dueDate) return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    return 0;
  });

  const days = (t: Task) => daysUntil(t.dueDate);
  const groups: Group[] = [
    { key: "overdue", title: "Overdue", tone: "danger", tasks: open.filter((t) => (days(t) ?? 1) < 0) },
    { key: "today", title: "Today", tasks: open.filter((t) => days(t) === 0) },
    { key: "week", title: "Next 7 days", tasks: open.filter((t) => (days(t) ?? -1) >= 1 && (days(t) ?? 0) <= 7) },
    { key: "later", title: "Later", tasks: open.filter((t) => (days(t) ?? -1) > 7) },
    { key: "none", title: "No deadline", tasks: open.filter((t) => t.dueDate === null) },
  ].filter((g) => g.tasks.length > 0) as Group[];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader kicker="TASKFLOW" title="Deadlines" marginBottom={16} />

        {groups.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No open deadlines"
            message="Unfinished tasks appear here, sorted by due date."
          />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={{ marginBottom: 6 }}>
              <View style={styles.groupHead}>
                <Text style={[styles.groupTitle, group.tone === "danger" && { color: colors.dangerText }]}>
                  {group.title}
                </Text>
                <Text style={styles.count}>{group.tasks.length}</Text>
              </View>
              {group.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: 28 },
  groupHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, marginTop: 4 },
  groupTitle: { fontSize: 15, fontWeight: "800", color: colors.ink },
  count: { fontSize: 11, fontWeight: "700", color: colors.inkSubdued },
});
