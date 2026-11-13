import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Notice from "@/components/ui/Notice";
import ScreenHeader from "@/components/ui/ScreenHeader";
import TaskCard from "@/components/ui/TaskCard";
import { colors, radii, spacing } from "@/constants/theme";
import { PRIORITY_WEIGHT } from "@/lib/task-utils";
import { useTasks, type Task } from "@/lib/tasks";

type Filter = "all" | "todo" | "in_progress" | "done";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
];

function compare(a: Task, b: Task) {
  // Open work first (by priority, then deadline); finished work sinks to the bottom.
  if ((a.status === "done") !== (b.status === "done")) return a.status === "done" ? 1 : -1;
  const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  if (byPriority) return byPriority;
  return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
}

export default function TasksScreen() {
  const { tasks, isLoading, error, refresh } = useTasks();
  const [filter, setFilter] = useState<Filter>("all");

  const shown = tasks.filter((t) => filter === "all" || t.status === filter).sort(compare);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader kicker="TASKFLOW" title="Your Tasks" marginBottom={14} />

        <Pressable
          style={({ pressed }) => [styles.newButton, pressed && { backgroundColor: colors.primaryHover }]}
          onPress={() => router.push("/task/new")}
          accessibilityRole="button"
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.white} />
          <Text style={styles.newButtonText}>Create new task</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>

        {error ? <Notice type="error" message={error} /> : null}

        {shown.length === 0 ? (
          <EmptyState
            icon="checkbox-outline"
            title={tasks.length === 0 ? "No tasks yet" : "Nothing here"}
            message={
              tasks.length === 0
                ? "Tap “Create new task” to add your first one."
                : "No tasks match this filter."
            }
          />
        ) : (
          <View>
            {shown.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: 28 },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    marginBottom: 14,
  },
  newButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  filters: { gap: 8, paddingBottom: 14 },
});
