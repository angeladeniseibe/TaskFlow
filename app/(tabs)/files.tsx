import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Chip from "@/components/ui/Chip";
import EmptyState from "@/components/ui/EmptyState";
import Notice from "@/components/ui/Notice";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SectionHead from "@/components/ui/SectionHead";
import { colors, radii, spacing } from "@/constants/theme";
import { useAuth } from "@/lib/auth";
import { confirmAction } from "@/lib/confirm";
import { formatBytes } from "@/lib/task-utils";
import { useTasks, type TaskFile } from "@/lib/tasks";

export default function FilesScreen() {
  const { user } = useAuth();
  const { tasks, isLoading, refresh, uploadFile, deleteFile, openFile } = useTasks();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Default to the first task until the person picks another.
  const target = tasks.find((t) => t.id === targetId) ?? tasks[0];
  const withFiles = tasks.filter((t) => t.files.length > 0);
  const totalFiles = tasks.reduce((n, t) => n + t.files.length, 0);

  const handleUpload = async () => {
    if (!target || isUploading) return;
    setError(null);
    setSuccess(null);
    const picked = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    if (picked.canceled || picked.assets.length === 0) return;
    const asset = picked.assets[0];
    setIsUploading(true);
    const result = await uploadFile(target.id, {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
    });
    setIsUploading(false);
    if (!result.ok) setError(result.error);
    else setSuccess(`Uploaded “${asset.name}” to ${target.title}.`);
  };

  const handleOpen = async (file: TaskFile) => {
    setError(null);
    const result = await openFile(file);
    if (!result.ok) setError(result.error);
  };

  const handleDelete = (file: TaskFile) =>
    confirmAction("Delete file", `Delete “${file.name}”? This can't be undone.`, "Delete", async () => {
      const result = await deleteFile(file);
      if (!result.ok) setError(result.error);
    });

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <ScreenHeader kicker="TASKFLOW" title="Files" marginBottom={16} />

        {tasks.length === 0 ? (
          <EmptyState icon="folder-open-outline" title="Create a task first" message="Files are kept with a task so you and your members can track them." />
        ) : (
          <>
            <View style={styles.uploadCard}>
              <Text style={styles.uploadTitle}>Upload to a task</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {tasks.map((t) => (
                  <Chip key={t.id} label={t.title} selected={t.id === target?.id} onPress={() => setTargetId(t.id)} />
                ))}
              </ScrollView>
              <Pressable
                style={({ pressed }) => [styles.uploadButton, pressed && { backgroundColor: colors.primaryHover }]}
                onPress={handleUpload}
                disabled={isUploading}
                accessibilityRole="button"
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={18} color={colors.white} />
                    <Text style={styles.uploadText}>Choose a file</Text>
                  </>
                )}
              </Pressable>
              <Text style={styles.limit}>Up to 25 MB per file.</Text>
            </View>

            {error ? <Notice type="error" message={error} /> : null}
            {success ? <Notice type="success" message={success} /> : null}

            <SectionHead title={`All files (${totalFiles})`} />
            {withFiles.length === 0 ? (
              <EmptyState icon="document-outline" title="No files yet" message="Upload drafts, slides or references and they'll be listed here." />
            ) : (
              withFiles.map((task) => (
                <View key={task.id} style={styles.group}>
                  <Pressable onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })} accessibilityRole="link">
                    <Text style={styles.groupTitle} numberOfLines={1}>{task.title}</Text>
                  </Pressable>
                  {task.files.map((file) => (
                    <View key={file.id} style={styles.fileRow}>
                      <Pressable style={styles.fileMain} onPress={() => handleOpen(file)} accessibilityRole="button" accessibilityLabel={`Open ${file.name}`}>
                        <View style={styles.fileIcon}>
                          <Ionicons name="document-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                          <Text style={styles.fileMeta}>
                            {formatBytes(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </Pressable>
                      {task.ownerId === user.id || file.uploaderId === user.id ? (
                        <Pressable onPress={() => handleDelete(file)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Delete ${file.name}`}>
                          <Ionicons name="trash-outline" size={19} color={colors.inkFaint} />
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.md, paddingBottom: 28 },
  uploadCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, marginBottom: 10 },
  chips: { gap: 8, paddingBottom: 12 },
  uploadButton: {
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  limit: { fontSize: 11, color: colors.inkFaint, marginTop: 8, textAlign: "center" },
  group: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  groupTitle: { fontSize: 14, fontWeight: "800", color: colors.ink, marginBottom: 4 },
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
  fileName: { fontSize: 14, fontWeight: "700", color: colors.ink },
  fileMeta: { fontSize: 12, color: colors.inkSubdued },
});
