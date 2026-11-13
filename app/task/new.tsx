import { Ionicons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/components/ui/BackButton";
import Chip from "@/components/ui/Chip";
import IconInput from "@/components/ui/IconInput";
import Notice from "@/components/ui/Notice";
import PrimaryButton from "@/components/ui/PrimaryButton";
import MemberSearch from "@/components/ui/MemberSearch";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { PRIORITY_LABEL } from "@/components/ui/PriorityTag";
import { colors, radii, shadow, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { showMessage } from "@/lib/confirm";
import { addDays, isValidDateString, PRIORITIES } from "@/lib/task-utils";
import { useTasks, type Person, type Priority } from "@/lib/tasks";

export default function NewTaskScreen() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Redirect href="/" />;
  return <NewTaskForm />;
}

function NewTaskForm() {
  const { createTask } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [members, setMembers] = useState<Person[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    if (isSaving) return;
    setError(null);
    if (!title.trim()) {
      setError("Give your task a title.");
      return;
    }
    if (dueDate.trim() && !isValidDateString(dueDate.trim())) {
      setError("Use the date format YYYY-MM-DD, e.g. 2026-12-01.");
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    const result = await createTask({
      title,
      description,
      priority,
      dueDate: dueDate.trim() || null,
      members,
    });
    setIsSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.data.memberErrors.length > 0) {
      showMessage(
        "Task created, but some members weren't added",
        result.data.memberErrors.join("\n") + "\n\nYou can add them again from the task page.",
      );
    }
    router.replace({ pathname: "/task/[id]", params: { id: result.data.id } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BackButton />
          <ScreenHeader kicker="NEW TASK" title="Create a task" marginBottom={16} showAvatar={false} />

          <View style={styles.card}>
            <IconInput
              label="Title"
              icon="document-text-outline"
              placeholder="e.g. History essay draft"
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              returnKeyType="next"
            />
            <IconInput
              label="Description (optional)"
              icon="reader-outline"
              placeholder="What needs to be done?"
              value={description}
              onChangeText={setDescription}
              multiline
              style={{ minHeight: 40 }}
            />

            <Text style={styles.label}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITIES.map((p) => (
                <Chip
                  key={p}
                  label={PRIORITY_LABEL[p][0] + PRIORITY_LABEL[p].slice(1).toLowerCase()}
                  selected={priority === p}
                  onPress={() => setPriority(p)}
                />
              ))}
            </View>

            <IconInput
              label="Deadline (YYYY-MM-DD)"
              icon="calendar-outline"
              placeholder="2026-12-01"
              value={dueDate}
              onChangeText={setDueDate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              autoCorrect={false}
            />
            <View style={[styles.chipRow, { marginTop: -6 }]}>
              <Chip label="Today" selected={dueDate === addDays(0)} onPress={() => setDueDate(addDays(0))} />
              <Chip label="Tomorrow" selected={dueDate === addDays(1)} onPress={() => setDueDate(addDays(1))} />
              <Chip label="In a week" selected={dueDate === addDays(7)} onPress={() => setDueDate(addDays(7))} />
              <Chip label="No deadline" selected={dueDate === ""} onPress={() => setDueDate("")} />
            </View>

            <Text style={styles.label}>Members</Text>
            <Text style={styles.hint}>Search the people who have a TaskFlow account.</Text>
            <MemberSearch
              excludeIds={members.map((m) => m.id)}
              onPick={(p) => setMembers((m) => [...m, p])}
            />
            {members.length > 0 ? (
              <View style={styles.pending}>
                {members.map((person) => (
                  <View key={person.id} style={styles.pendingChip}>
                    <Text style={styles.pendingText}>{person.fullName}</Text>
                    <Pressable
                      onPress={() => setMembers((m) => m.filter((x) => x.id !== person.id))}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${person.fullName}`}
                    >
                      <Ionicons name="close-circle" size={16} color={colors.inkFaint} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {error ? <Notice type="error" message={error} /> : null}
            <PrimaryButton label="Create task" onPress={handleCreate} loading={isSaving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  label: { fontSize: 13, fontWeight: "600", color: colors.inkSubdued, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.inkFaint, marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  memberRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  pending: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  pendingChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  pendingText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
});
