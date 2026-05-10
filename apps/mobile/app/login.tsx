import { useState } from "react";
import { View, Text, YStack, Input, Button, H2 } from "tamagui";
import { useRouter } from "expo-router";
import { loginUser } from "../src/services/auth";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (phone.length < 9) {
      alert("Tafadhali weka nambari sahihi. (Please enter a valid number).");
      return;
    }
    setIsLoading(true);
    await loginUser(phone);
    setIsLoading(false);

    // Navigate to the main dashboard
    router.replace("/");
  };

  return (
    <View
      flex={1}
      backgroundColor="$background"
      padding="$4"
      justifyContent="center"
    >
      <YStack space="$4" alignItems="center" marginBottom="$8">
        <H2 color="$green10" fontWeight="bold">
          PulseGuard
        </H2>
        <Text color="$gray11" textAlign="center">
          Enter your M-Pesa number to activate your resilience wallet.
        </Text>
      </YStack>

      <YStack space="$4">
        <Input
          size="$5"
          placeholder="e.g. 0712345678"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          backgroundColor="$white1"
        />
        <Button
          theme="active"
          size="$5"
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Verifying..." : "Continue / Endelea"}
        </Button>
      </YStack>
    </View>
  );
}
