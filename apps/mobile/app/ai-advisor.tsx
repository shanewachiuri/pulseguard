import { useState } from "react";
import {
  View,
  Text,
  YStack,
  XStack,
  Input,
  Button,
  ScrollView,
  Spinner,
} from "tamagui";
import { SafeAreaView } from "react-native-safe-area-context";
import { Platform, Alert } from "react-native";
import { getUserPhone } from "../src/services/auth";
import { useRouter } from "expo-router";

// Replace the old Platform.OS check with this direct IP address
const BACKEND_URL = "http://192.168.8.33:8000";

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPolicyId, setPendingPolicyId] = useState<string | null>(null);
  const router = useRouter();

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg = inputText;
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInputText("");
    setIsLoading(true);

    try {
      const phone = await getUserPhone();
      const res = await fetch(`${BACKEND_URL}/engine/pulse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, input_data: userMsg }),
      });

      if (!res.ok) throw new Error("API Error");
      const data = await res.json();

      if (data.assessment) {
        setMessages((prev) => [...prev, { role: "ai", text: data.assessment }]);
      }
      if (data.policy_id) {
        setPendingPolicyId(data.policy_id); // Save the ID to link the payment
      }
    } catch (error) {
      Alert.alert("Network Error", "Failed to reach Pulse Engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerMpesa = async () => {
    if (!pendingPolicyId) return;
    setIsLoading(true);
    try {
      const phone = await getUserPhone();
      const res = await fetch(`${BACKEND_URL}/payments/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount: 50, policy_id: pendingPolicyId }),
      });

      if (res.ok) {
        Alert.alert(
          "Check your phone!",
          "Enter your M-Pesa PIN to activate your coverage.",
          [{ text: "OK", onPress: () => router.replace("/") }],
        );
      }
    } catch (error) {
      Alert.alert("Payment Error", "Could not reach Safaricom M-Pesa gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <YStack flex={1} padding="$4" space="$4">
        <Text fontSize="$6" fontWeight="bold" color="$green10">
          Pulse AI Advisor
        </Text>

        <ScrollView flex={1} space="$3">
          <Text color="$gray11" marginBottom="$4">
            Describe your farm or daily boda-boda routes to get a custom policy
            assessment.
          </Text>

          {messages.map((msg, i) => (
            <View
              key={i}
              alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
              backgroundColor={msg.role === "user" ? "$green5" : "$white1"}
              padding="$3"
              borderRadius="$4"
              maxWidth="80%"
            >
              <Text color={msg.role === "user" ? "$green11" : "$black1"}>
                {msg.text}
              </Text>
            </View>
          ))}

          {isLoading && (
            <Spinner
              size="small"
              color="$green10"
              alignSelf="center"
              marginTop="$2"
            />
          )}

          {pendingPolicyId && !isLoading && (
            <Button theme="active" marginTop="$4" onPress={triggerMpesa}>
              Pay KSh 50 via M-Pesa
            </Button>
          )}
        </ScrollView>

        <XStack space="$2" alignItems="center">
          <Input
            flex={1}
            value={inputText}
            onChangeText={setInputText}
            placeholder="e.g. I farm maize in Nyeri..."
            onSubmitEditing={sendMessage}
          />
          <Button theme="active" onPress={sendMessage} disabled={isLoading}>
            Send
          </Button>
        </XStack>
      </YStack>
    </SafeAreaView>
  );
}
