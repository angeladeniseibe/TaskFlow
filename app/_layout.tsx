import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/lib/auth";
import { TasksProvider } from "@/lib/tasks";

export default function RootLayout() {
  return (
    <AuthProvider>
      <TasksProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="create-account" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="task/new" />
          <Stack.Screen name="task/[id]" />
          {/* Disable swipe-back so users can't gesture back to Login once signed in. */}
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        </Stack>
      </TasksProvider>
    </AuthProvider>
  );
}
