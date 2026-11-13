import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/ui/EmptyState";
import { PRIORITY_COLORS, PRIORITY_LABEL } from "@/components/ui/PriorityTag";
import ProgressBar from "@/components/ui/ProgressBar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionHead from "@/components/ui/SectionHead";
import TaskCard from "@/components/ui/TaskCard";
import { colors, spacing } from "@/constants/theme";
import { overallPercent, PRIORITIES } from "@/lib/task-utils";
import { useTasks } from "@/lib/tasks";

export default function ProgressScreen() {
  const { tasks, isLoading, refresh } = useTasks();

  const percent = overallPercent(tasks);
  const todo = tasks.filter((t) => t.status === "todo").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const byProgress = [...tasks].sort((a, b) => a.progress - b.progress);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader kicker="TASKFLOW" title="Your Progress" marginBottom={16} />

        {tasks.length === 0 ? (
          <EmptyState icon="stats-chart-outline" title="Nothing to track yet" message="Create a task and update its progress to see your stats here." />
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>OVERALL COMPLETION</Text>
              <Text style={styles.heroPercent}>{percent}%</Text>
              <ProgressBar percent={percent} height={10} />
              <Text style={styles.heroSub}>
                {done} of {tasks.length} task{tasks.length === 1 ? "" : "s"} finished
              </Text>
            </View>

            <View style={styles.statusRow}>
              <StatusBox value={todo} label="To do" />
              <StatusBox value={inProgress} label="In progress" />
              <StatusBox value={done} label="Done" />
            </View>

            <SectionHead title="By priority" />
            <View style={styles.card}>
              {PRIORITIES.slice()
                .reverse()
                .map((p) => {
                  const group = tasks.filter((t) => t.priority === p);
                  const avg = overallPercent(group);
                  return (
                    <View key={p} style={styles.priorityRow}>
                      <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[p].text }]} />
                      <Text style={styles.priorityLabel}>{PRIORITY_LABEL[p]}</Text>
                      <View style={{ flex: 1 }}>
                        <ProgressBar percent={avg} height={6} />
                      </View>
                      <Text style={styles.priorityMeta}>
                        {group.length === 0 ? "–" : `${avg}% · ${group.length}`}
                      </Text>
                    </View>
                  );
                })}
            </View>

            <SectionHead title="Every task" />
            {byProgress.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statusBox}>
      <Text style={styles.statusValue}>{value}</Text>
      <Text style={styles.statusLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: 28 },
  hero: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  heroLabel: { fontSize: 10, fontWeight: "800", color: colors.primary, letterSpacing: 1 },
  heroPercent: { fontSize: 40, fontWeight: "800", color: colors.ink, marginTop: 2 },
  heroSub: { fontSize: 12, color: colors.inkSubdued },
  statusRow: { flexDirection: "row", gap: 9, marginBottom: 12 },
  statusBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    padding: 12,
    alignItems: "center",
  },
  statusValue: { fontSize: 22, fontWeight: "800", color: colors.ink },
  statusLabel: { fontSize: 11, color: colors.inkSubdued, marginTop: 2 },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  priorityLabel: { width: 62, fontSize: 11, fontWeight: "800", color: colors.ink },
  priorityMeta: { width: 62, fontSize: 11, color: colors.inkSubdued, textAlign: "right" },
});
