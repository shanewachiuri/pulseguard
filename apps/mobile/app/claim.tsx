import { useState, useRef } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Text, View, XStack, YStack, Image } from "tamagui";
import { savePendingClaim } from "../src/db";
import { useRouter } from "expo-router";

export default function ClaimScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const router = useRouter();

  if (!permission) {
    return <View flex={1} backgroundColor="$background" />;
  }

  if (!permission.granted) {
    return (
      <View
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$4"
        backgroundColor="$background"
      >
        <Text textAlign="center" fontSize="$5" marginBottom="$4">
          We need camera access to assess the damage for your claim.
        </Text>
        <Button onPress={requestPermission} theme="active">
          Grant Permission
        </Button>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo!.uri);
    }
  };

  const saveAndSync = async () => {
    if (photoUri) {
      // Save to offline PouchDB (using the mock policy ID for now)
      await savePendingClaim("pol-123", photoUri);
      alert("Claim saved locally! It will sync when connected to the network.");
      router.back();
    }
  };

  return (
    <View flex={1} backgroundColor="$black1">
      {!photoUri ? (
        <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
          <View
            flex={1}
            justifyContent="flex-end"
            paddingBottom="$8"
            alignItems="center"
          >
            <Button size="$6" theme="active" circular onPress={takePicture}>
              Snap
            </Button>
          </View>
        </CameraView>
      ) : (
        <YStack flex={1} padding="$4" space="$4" justifyContent="center">
          <Image
            source={{ uri: photoUri }}
            width="100%"
            height={400}
            borderRadius="$4"
          />
          <XStack space="$4" justifyContent="center" marginTop="$4">
            <Button variant="outlined" onPress={() => setPhotoUri(null)}>
              Retake
            </Button>
            <Button theme="active" onPress={saveAndSync}>
              Submit Claim
            </Button>
          </XStack>
        </YStack>
      )}
    </View>
  );
}
