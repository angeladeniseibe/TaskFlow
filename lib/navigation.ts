import { router } from "expo-router";

/** Clears the auth screens off the stack so "back" can't return to Login while signed in. */
export function goToDashboard() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/(tabs)/home");
}

/** Clears the app screens off the stack so "back" can't return into the app after logging out. */
export function goToLogin() {
  if (router.canDismiss()) router.dismissAll();
  router.replace("/");
}
