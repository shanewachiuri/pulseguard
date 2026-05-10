import "setimmediate"; // Web PouchDB Polyfill must remain first
import "../src/i18n"; // Initialize translations before UI renders
import { Stack, useRouter, useSegments } from "expo-router";
import { TamaguiProvider, Theme } from "tamagui";
import tamaguiConfig from "../tamagui.config";
import { useEffect, useState } from "react";
import { getUserPhone } from "../src/services/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkAuth = async () => {
      const phone = await getUserPhone();
      setIsAuthenticated(!!phone);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;
    const inAuthGroup = segments[0] === "login";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
        <Theme name="light">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ animation: "fade" }} />
            <Stack.Screen name="index" />
            <Stack.Screen name="claim" />
            <Stack.Screen
              name="ai-advisor"
              options={{ presentation: "modal" }}
            />
          </Stack>
        </Theme>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
