import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/components/ui/BackButton";
import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Notice from "@/components/ui/Notice";
import MemberSearch from "@/components/ui/MemberSearch";
import PriorityTag from "@/components/ui/PriorityTag";
import ProgressBar from "@/components/ui/ProgressBar";
import SectionHead from "@/components/ui/SectionHead";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { confirmAction, showMessage } from "@/lib/confirm";
import { formatBytes, formatDue, isOverdue, PROGRESS_STEPS } from "@/lib/task-utils";
import { useTasks, type Person, type TaskFile } from "@/lib/tasks";

export default function TaskDetailScreen() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Redirect href="/" />;
  return <TaskDetail />;
}

function initialsOf(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { tasks, isLoading, setProgress, deleteTask, addMember, removeMember, uploadFile, deleteFile, openFile } =
    useTasks();

  const [isUploading, setIsUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.content}>
          <BackButton />
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <EmptyState icon="help-circle-outline" title="Task not found" message="It may have been deleted, or you no longer have access." />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = task.ownerId === user.id;
  const overdue = isOverdue(task);

  const changeProgress = async (value: number) => {
    const result = await setProgress(task.id, value);
    if (!result.ok) showMessage("Couldn't update progress", result.error);
  };

  const handleAddMember = async (person: Person) => {
    const result = await addMember(task.id, person);
    if (!result.ok) showMessage("Couldn't add member", result.error);
  };

  const handleRemoveMember = (person: Person) => {
    const leaving = person.id === user.id;
    confirmAction(
      leaving ? "Leave task" : "Remove member",
      leaving ? "You'll lose access to this task and its files." : `Remove ${person.fullName} from this task?`,
      leaving ? "Leave" : "Remove",
      async () => {
        const result = await removeMember(task.id, person.id);
        if (!result.ok) showMessage("Couldn't remove", result.error);
        else if (leaving) router.replace("/(tabs)/tasks");
      },
    );
  };

  const handleUpload = async () => {
    if (isUploading) return;
    setFileError(null);
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || picked.assets.length === 0) return;
    const asset = picked.assets[0];
    setIsUploading(true);
    const result = await uploadFile(task.id, {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    });
    setIsUploading(false);
    if (!result.ok) setFileError(result.error);
  };

  const handleOpen = async (file: TaskFile) => {
    const result = await openFile(file);
    if (!result.ok) setFileError(result.error);
  };

  const handleDeleteFile = (file: TaskFile) =>
    confirmAction("Delete file", `Delete “${file.name}”? This can't be undone.`, "Delete", async () => {
      const result = await deleteFile(file);
      if (!result.ok) setFileError(result.error);
    });

  const handleDeleteTask = () =>
    confirmAction(
      "Delete task",
      "This permanently deletes the task, its members and all its files for everyone.",
      "Delete",
      async () => {
        const result = await deleteTask(task.id);
        if (!result.ok) showMessage("Couldn't delete", result.error);
        else router.replace("/(tabs)/tasks");
      },
    );

  const people: { person: Person; role: "Owner" | "Member" }[] = [
    { person: task.owner, role: "Owner" },
    ...task.members.map((p) => ({ person: p, role: "Member" as const })),
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <BackButton />

        <View style={styles.titleRow}>
          <Text style={styles.title} accessibilityRole="header">{task.title}</Text>
          <PriorityTag priority={task.priority} />
        </View>
        {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

        <View style={styles.dueRow}>
          <Ionicons name="calendar-outline" size={15} color={overdue ? colors.danger : colors.inkSubdued} />
          <Text style={[styles.dueText, overdue && { color: colors.dangerText, fontWeight: "700" }]}>
            {formatDue(task.dueDate)}
            {task.dueDate ? `  ·  ${task.dueDate}` : ""}
          </Text>
        </View>

        {/* ---- Progress ---- */}
        <SectionHead title="Progress" />
        <View style={styles.card}>
          <View style={styles.progressTop}>
            <Text style={styles.statusText}>
              {task.status === "done" ? "Completed" : task.status === "in_progress" ? "In progress" : "Not started"}
            </Text>
            <Text style={styles.percent}>{task.progress}%</Text>
          </View>
          <ProgressBar percent={task.progress} height={10} />
          <View style={styles.stepRow}>
            {PROGRESS_STEPS.map((step) => (
              <Chip key={step} label={`${step}%`} selected={task.progress === step} onPress={() => changeProgress(step)} />
            ))}
          </View>
        </View>

        {/* ---- Members ---- */}
        <SectionHead title={`Members (${people.length})`} />
        <View style={styles.card}>
          {people.map(({ person, role }) => {
            const canRemove = role === "Member" && isOwner;
            return (
              <View key={person.id} style={styles.personRow}>
                <View style={styles.personAvatar}>
                  <Text style={styles.personInitials}>{initialsOf(person.fullName)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName} numberOfLines={1}>
                    {person.fullName}
                    {person.id === user.id ? " (you)" : ""}
                  </Text>
                  {person.email ? <Text style={styles.personEmail} numberOfLines={1}>{person.email}</Text> : null}
                </View>
                <Text style={styles.role}>{role}</Text>
                {canRemove ? (
                  <Pressable
                    onPress={() => handleRemoveMember(person)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={person.id === user.id ? "Leave task" : `Remove ${person.fullName}`}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={colors.inkFaint} />
                  </Pressable>
                ) : null}
              </View>
            );
          })}

          {isOwner ? (
            <View style={{ marginTop: spacing.sm }}>
              <MemberSearch excludeIds={people.map((x) => x.person.id)} onPick={handleAddMember} />
            </View>
          ) : null}
        </View>

        {/* ---- Files ---- */}
        <SectionHead title={`Files (${task.files.length})`} />
        <View style={styles.card}>
          {task.files.length === 0 ? (
            <Text style={styles.personEmail}>No files yet. Upload drafts, slides or references to keep them with this task.</Text>
          ) : (
            task.files.map((file) => (
              <View key={file.id} style={styles.fileRow}>
                <Pressable style={styles.fileMain} onPress={() => handleOpen(file)} accessibilityRole="button" accessibilityLabel={`Open ${file.name}`}>
                  <View style={styles.fileIcon}>
                    <Ionicons name="document-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.personEmail}>
                      {formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Pressable>
                {isOwner || file.uploaderId === user.id ? (
                  <Pressable onPress={() => handleDeleteFile(file)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${file.name}`}>
                    <Ionicons name="trash-outline" size={19} color={colors.inkFaint} />
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
          {fileError ? <Notice type="error" message={fileError} /> : null}
          <Pressable
            style={({ pressed }) => [styles.uploadButton, pressed && { backgroundColor: colors.primarySoft }]}
            onPress={handleUpload}
            disabled={isUploading}
            accessibilityRole="button"
          >
            {isUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                <Text style={styles.uploadText}>Upload a file</Text>
              </>
            )}
          </Pressable>
        </View>

        {isOwner ? (
          <Pressable style={({ pressed }) => [styles.deleteButton, pressed && { backgroundColor: colors.dangerSoft }]} onPress={handleDeleteTask} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={colors.dangerText} />
            <Text style={styles.deleteText}>Delete task</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: colors.ink, letterSpacing: -0.4 },
  description: { fontSize: 14, color: colors.inkSubdued, marginTop: 8, lineHeight: 20 },
  dueRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, marginBottom: 6 },
  dueText: { fontSize: 13, color: colors.inkSubdued },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  progressTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { fontSize: 13, fontWeight: "700", color: colors.ink },
  percent: { fontSize: 22, fontWeight: "800", color: colors.primary },
  stepRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  personRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  personAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.avatar,
    alignItems: "center",
    justifyContent: "center",
  },
  personInitials: { fontSize: 12, fontWeight: "800", color: colors.primary },
  personName: { fontSize: 14, fontWeight: "700", color: colors.ink },
  personEmail: { fontSize: 12, color: colors.inkSubdued },
  role: { fontSize: 10, fontWeight: "800", color: colors.inkFaint, letterSpacing: 0.4 },
  addLink: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  fileRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  fileMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  fileIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButton: {
    marginTop: spacing.sm,
    height: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.white,
  },
  deleteText: { fontSize: 15, fontWeight: "700", color: colors.dangerText },
});
