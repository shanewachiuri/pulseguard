import { View, Text, YStack, Card, H2, Button, XStack, Spinner } from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Alert, Platform } from "react-native";
import { syncClaims } from "../src/services/sync";
import { startTelematicsPing } from "../src/services/telematics";
import { useState, useCallback } from "react";
import { getPendingClaims } from "../src/db";
import { getUserPhone, logoutUser } from "../src/services/auth";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// Replace the old Platform.OS check with this direct IP address
const BACKEND_URL = "http://192.168.8.33:8000";

export default function DashboardScreen() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false); // Fixed missing destructuring
  const [pendingCount, setPendingCount] = useState(0);
  const { t, i18n } = useTranslation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const phone = await getUserPhone();
      const res = await fetch(`${BACKEND_URL}/dashboard/${phone}`);
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  useFocusEffect(
    useCallback(() => {
      getPendingClaims().then((claims) => setPendingCount(claims.length));
    }, []), // Fixed missing dependency array
  );

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncClaims();
    setIsSyncing(false);
    Alert.alert("Sync Status", result.message);
    const updatedClaims = await getPendingClaims();
    setPendingCount(updatedClaims.length);
  };

  const handleStartTrip = async () => {
    const phone = await getUserPhone();
    Alert.alert(
      "Trip Started",
      "Tracking safe driving for premium discounts...",
    );
    await startTelematicsPing(phone!);
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "sw" : "en");
  };

  if (isLoading) {
    return (
      <View flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$green10" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <YStack padding="$4" space="$4">
        {/* Header with Language Toggle */}
        <XStack justifyContent="space-between" alignItems="center">
          <H2 fontWeight="bold" color="$green10">
            {t("dashboard.title")}
          </H2>
          <XStack space="$2" alignItems="center">
            <Button size="$2" onPress={toggleLanguage} theme="active">
              {i18n.language === "en" ? "SW" : "EN"}
            </Button>
            <View backgroundColor="$green5" padding="$2" borderRadius="$4">
              <Text color="$green11" fontWeight="bold">
                {t("dashboard.score")}: {dashboardData?.pulseScore || 0}
              </Text>
            </View>
          </XStack>
        </XStack>

        {/* Active Policy Card */}
        {dashboardData?.policy ? (
          <Card elevate size="$4" bordered backgroundColor="$white1" padded>
            <H2>{t("dashboard.active_coverage")}</H2>
            <Text color="$gray11" marginTop="$2">
              {dashboardData.policy.coverageType}
            </Text>
            <Text fontWeight="bold" marginTop="$1">
              {t("dashboard.premium")}: KSh {dashboardData.policy.premiumAmount}
              /week
            </Text>
            <Text color="$green10" marginTop="$2">
              {t("dashboard.status")}: Active
            </Text>
          </Card>
        ) : (
          <Card elevate size="$4" bordered backgroundColor="$white1" padded>
            <Text color="$gray11" textAlign="center">
              No active policies found.
            </Text>
            <Button
              theme="active"
              size="$3"
              marginTop="$4"
              onPress={() => router.push("/ai-advisor")}
            >
              Chat with AI Advisor
            </Button>
          </Card>
        )}

        {/* Action Buttons mapped to locales */}
        <Button
          theme="active"
          size="$5"
          marginTop="$4"
          onPress={handleStartTrip}
        >
          {t("dashboard.start_trip")}
        </Button>
        <Button
          variant="outlined"
          size="$5"
          onPress={() => router.push("/claim")}
        >
          {t("dashboard.report_incident")}
        </Button>
        <Button
          variant="outlined"
          size="$5"
          onPress={handleSync}
          disabled={isSyncing || pendingCount === 0}
        >
          {isSyncing
            ? "Syncing..."
            : `${t("dashboard.sync")} (${pendingCount})`}
        </Button>
        <Button
          variant="outlined"
          size="$4"
          theme="red"
          marginTop="$4"
          onPress={handleLogout}
        >
          {t("dashboard.logout")}
        </Button>
      </YStack>
    </SafeAreaView>
  );
}
