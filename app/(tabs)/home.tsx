import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EmptyState from "@/components/ui/EmptyState";
import Notice from "@/components/ui/Notice";
import ProgressBar from "@/components/ui/ProgressBar";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionHead from "@/components/ui/SectionHead";
import TaskCard from "@/components/ui/TaskCard";
import type { IconName } from "@/components/ui/icon";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import {
  formatDue,
  isDone,
  isOverdue,
  overallPercent,
  sortByDeadline,
  sortByPriority,
} from "@/lib/task-utils";
import { useTasks } from "@/lib/tasks";

const goTo = (path: "/(tabs)/tasks" | "/(tabs)/progress" | "/(tabs)/deadlines") => () => router.navigate(path);

export default function HomeScreen() {
  const { user } = useAuth();
  const { tasks, isLoading, error, refresh } = useTasks();

  const completed = tasks.filter(isDone).length;
  const active = tasks.length - completed;
  const overdue = tasks.filter(isOverdue).length;
  const percent = overallPercent(tasks);

  const topPriority = sortByPriority(tasks).slice(0, 3);
  const withDeadline = sortByDeadline(tasks.filter((t) => !isDone(t) && t.dueDate));
  const next = withDeadline[0];
  const upcoming = withDeadline.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader
          kicker="TASKFLOW · YOUR WORKSPACE"
          title={`Welcome Back, ${user.firstName}! 👋`}
          titleFontSize={20}
          marginBottom={16}
        />

        {error ? <Notice type="error" message={error} /> : null}

        {next ? (
          <Pressable
            style={styles.banner}
            onPress={() => router.push({ pathname: "/task/[id]", params: { id: next.id } })}
            accessibilityRole="button"
            accessibilityLabel={`Next deadline: ${next.title}, ${formatDue(next.dueDate)}`}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="rocket-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Next up: {next.title}</Text>
              <Text style={[styles.bannerText, isOverdue(next) && { color: colors.dangerText }]}>
                {formatDue(next.dueDate)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
        ) : null}

        <SectionHead title="Overview" actionLabel="All tasks" onAction={goTo("/(tabs)/tasks")} />
        <View style={styles.overviewRow}>
          <Stat value={active} label="Active" icon="list-outline" />
          <Stat value={completed} label="Completed" icon="checkmark-circle-outline" />
          <Stat value={overdue} label="Overdue" icon="alert-circle-outline" danger={overdue > 0} />
        </View>

        <SectionHead title="Your Progress" actionLabel="Details" onAction={goTo("/(tabs)/progress")} />
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={styles.progressLabel}>Overall</Text>
            <Text style={styles.progressPercent}>{percent}%</Text>
          </View>
          <ProgressBar percent={percent} height={8} />
          <Text style={styles.muted}>
            {tasks.length === 0
              ? "No tasks yet"
              : `${completed} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} completed`}
          </Text>
        </View>

        <SectionHead title="Most Priority" actionLabel="View all" onAction={goTo("/(tabs)/tasks")} />
        {topPriority.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title={tasks.length === 0 ? "No tasks yet" : "All caught up!"}
            message={
              tasks.length === 0
                ? "Create your first task and add your members."
                : "Nothing left to do. Nice work."
            }
          />
        ) : (
          topPriority.map((task) => <TaskCard key={task.id} task={task} />)
        )}

        <SectionHead title="Upcoming Deadlines" actionLabel="View all" onAction={goTo("/(tabs)/deadlines")} />
        {upcoming.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No deadlines set"
            message="Give a task a due date and it will show up here."
          />
        ) : (
          upcoming.map((task) => <TaskCard key={task.id} task={task} showProgress={false} />)
        )}
      </ScrollView>

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { backgroundColor: colors.primaryHover }]}
        onPress={() => router.push("/task/new")}
        accessibilityRole="button"
        accessibilityLabel="Create a new task"
      >
        <Ionicons name="add" size={26} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

function Stat({ value, label, icon, danger }: { value: number; label: string; icon: IconName; danger?: boolean }) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={16} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: 96 },
  banner: {
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: { fontSize: 13, fontWeight: "800", color: colors.ink },
  bannerText: { fontSize: 11, color: colors.inkSubdued, marginTop: 2 },
  overviewRow: { flexDirection: "row", gap: 9, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: colors.white, borderRadius: 13, padding: 12, borderWidth: 1, borderColor: colors.border },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: "800", color: colors.ink },
  statLabel: { fontSize: 11, color: colors.inkSubdued, marginTop: 1 },
  progressCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 13, fontWeight: "700", color: colors.ink },
  progressPercent: { fontSize: 18, fontWeight: "800", color: colors.primary },
  muted: { fontSize: 11, color: colors.inkSubdued },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
