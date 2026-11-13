import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Linking, Platform } from "react-native";

import { useAuth } from "@/lib/auth";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in_progress" | "done";

export type Person = { id: string; fullName: string; email: string };

export type TaskFile = {
  id: string;
  taskId: string;
  uploaderId: string;
  name: string;
  /** Where the file is stored on this device. */
  path: string;
  size: number;
  mime: string;
  createdAt: string;
};

export type Task = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  priority: Priority;
  progress: number;
  status: Status;
  dueDate: string | null;
  createdAt: string;
  owner: Person;
  members: Person[];
  files: TaskFile[];
};

export type NewTask = {
  title: string;
  description: string;
  priority: Priority;
  dueDate: string | null;
  members: Person[];
};

export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
export type PickedFile = { uri: string; name: string; size?: number | null; mimeType?: string | null };

type TasksContextValue = {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createTask: (input: NewTask) => Promise<Result<{ id: string; memberErrors: string[] }>>;
  setProgress: (taskId: string, progress: number) => Promise<Result>;
  deleteTask: (taskId: string) => Promise<Result>;
  addMember: (taskId: string, person: Person) => Promise<Result>;
  removeMember: (taskId: string, memberId: string) => Promise<Result>;
  uploadFile: (taskId: string, file: PickedFile) => Promise<Result>;
  deleteFile: (file: TaskFile) => Promise<Result>;
  openFile: (file: TaskFile) => Promise<Result>;
};

// One shared store for every account on this device; each person sees only their own tasks.
const STORE_KEY = "taskflow.tasks.v2";
const statusOf = (progress: number): Status => (progress >= 100 ? "done" : progress > 0 ? "in_progress" : "todo");
const failure = (error: string): { ok: false; error: string } => ({ ok: false, error });
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const safeName = (name: string) => name.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, "_").slice(-80);

/** On phones, copy the picked file out of the temporary cache so it survives restarts. */
function removeStored(path: string) {
  if (Platform.OS === "web") return;
  try {
    const f = new File(path);
    if (f.exists) f.delete();
  } catch {
    // already gone
  }
}

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allRef = useRef<Task[]>([]); // every task on the device
  const userIdRef = useRef<string>("");

  const visibleTo = (all: Task[], uid: string) =>
    all.filter((t) => t.ownerId === uid || t.members.some((m) => m.id === uid));

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    setIsLoading(true);
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const loaded: Task[] = raw ? JSON.parse(raw) : [];
      userIdRef.current = user.id;
      allRef.current = loaded;
      setTasks(visibleTo(loaded, user.id));
      setError(null);
    } catch {
      setError("Couldn't read your saved tasks.");
    }
    setIsLoading(false);
  }, [isSignedIn, user.id]);

  useEffect(() => {
    if (isSignedIn) void load();
    else {
      userIdRef.current = "";
      allRef.current = [];
      setTasks([]);
      setError(null);
    }
  }, [isSignedIn, load]);

  /** Applies a change, updates the screen, and saves to the device. */
  const commit = useCallback(async (next: Task[]) => {
    allRef.current = next;
    setTasks(visibleTo(next, userIdRef.current));
    try {
      await AsyncStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      setError("Couldn't save your changes. Is your device storage full?");
    }
  }, []);

  const update = useCallback(
    (taskId: string, fn: (t: Task) => Task) =>
      commit(allRef.current.map((t) => (t.id === taskId ? fn(t) : t))),
    [commit],
  );

  const owner: Person = useMemo(
    () => ({ id: user.id, fullName: user.fullName, email: user.email }),
    [user.id, user.fullName, user.email],
  );

  const addMember = useCallback(
    async (taskId: string, person: Person): Promise<Result> => {
      const task = allRef.current.find((t) => t.id === taskId);
      if (!task) return failure("Task not found.");
      if (person.id === task.ownerId || task.members.some((m) => m.id === person.id)) {
        return failure(`${person.fullName} is already on this task.`);
      }
      await update(taskId, (t) => ({ ...t, members: [...t.members, person] }));
      return ok(undefined);
    },
    [update],
  );

  const createTask = useCallback(
    async (input: NewTask) => {
      const id = Crypto.randomUUID();
      const task: Task = {
        id,
        ownerId: user.id,
        title: input.title.trim(),
        description: input.description.trim(),
        priority: input.priority,
        progress: 0,
        status: "todo",
        dueDate: input.dueDate,
        createdAt: new Date().toISOString(),
        owner,
        members: input.members,
        files: [],
      };
      await commit([task, ...allRef.current]);
      return ok({ id, memberErrors: [] as string[] });
    },
    [commit, owner, user.id],
  );

  const setProgress = useCallback(
    async (taskId: string, progress: number): Promise<Result> => {
      await update(taskId, (t) => ({ ...t, progress, status: statusOf(progress) }));
      return ok(undefined);
    },
    [update],
  );

  const removeMember = useCallback(
    async (taskId: string, memberId: string): Promise<Result> => {
      await update(taskId, (t) => ({ ...t, members: t.members.filter((m) => m.id !== memberId) }));
      return ok(undefined);
    },
    [update],
  );

  const deleteTask = useCallback(
    async (taskId: string): Promise<Result> => {
      allRef.current.find((t) => t.id === taskId)?.files.forEach((f) => removeStored(f.path));
      await commit(allRef.current.filter((t) => t.id !== taskId));
      return ok(undefined);
    },
    [commit],
  );

  const uploadFile = useCallback(
    async (taskId: string, file: PickedFile): Promise<Result> => {
      if (file.size && file.size > MAX_FILE_BYTES) return failure("Files can be at most 25 MB.");

      const id = Crypto.randomUUID();
      let path = file.uri;
      let size = file.size ?? 0;
      if (Platform.OS !== "web") {
        try {
          const source = new File(file.uri);
          const copy = new File(Paths.document, `${Date.now()}-${safeName(file.name)}`);
          source.copy(copy);
          path = copy.uri;
          size = copy.size || size;
        } catch {
          return failure("Couldn't save that file. Try picking it again.");
        }
      }
      const entry: TaskFile = {
        id,
        taskId,
        uploaderId: user.id,
        name: file.name,
        path,
        size,
        mime: file.mimeType || "application/octet-stream",
        createdAt: new Date().toISOString(),
      };
      await update(taskId, (t) => ({ ...t, files: [entry, ...t.files] }));
      return ok(undefined);
    },
    [update, user.id],
  );

  const deleteFile = useCallback(
    async (file: TaskFile): Promise<Result> => {
      removeStored(file.path);
      await update(file.taskId, (t) => ({ ...t, files: t.files.filter((f) => f.id !== file.id) }));
      return ok(undefined);
    },
    [update],
  );

  const openFile = useCallback(async (file: TaskFile): Promise<Result> => {
    try {
      if (Platform.OS === "web") {
        await Linking.openURL(file.path);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.path, { mimeType: file.mime, dialogTitle: file.name });
      } else {
        return failure("This device can't open files from here.");
      }
      return ok(undefined);
    } catch {
      return failure("Couldn't open that file. It may have been moved or removed.");
    }
  }, []);

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      isLoading,
      error,
      refresh: load,
      createTask,
      setProgress,
      deleteTask,
      addMember,
      removeMember,
      uploadFile,
      deleteFile,
      openFile,
    }),
    [tasks, isLoading, error, load, createTask, setProgress, deleteTask, addMember, removeMember, uploadFile, deleteFile, openFile],
  );

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasks(): TasksContextValue {
  const context = useContext(TasksContext);
  if (!context) throw new Error("useTasks must be used inside <TasksProvider>");
  return context;
}
