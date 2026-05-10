import * as Network from 'expo-network';
import { Platform } from 'react-native';
import db, { getPendingClaims } from '../db';

// Android emulator needs 10.0.2.2 to access localhost. 
// For testing on a physical device via Expo Go, replace localhost with your actual computer's IPv4 address.
const BACKEND_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export const syncClaims = async () => {
    try {
        // 1. Check network status to preserve battery and prevent failed requests
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
            return { success: false, message: 'No internet connection. Claims remain safely stored offline.' };
        }

        // 2. Fetch pending claims from local PouchDB
        const claims = await getPendingClaims();
        if (claims.length === 0) {
            return { success: true, message: 'All claims are already synced!' };
        }

        let syncedCount = 0;

        for (const claim of claims) {
            const formData = new FormData();
            const filename = claim.imageUri.split('/').pop() || 'claim.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // React Native's FormData expects this specific object shape for file uploads
            formData.append('file', {
                uri: claim.imageUri,
                name: filename,
                type,
            } as any);

            // 3. Push to our FastAPI Vision Engine
            const response = await fetch(`${BACKEND_URL}/claims/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.ok) {
                const result = await response.json();
                console.log('AI Triage Result:', result);
                
                // 4. Remove from local DB once successfully safely stored on the server
                const doc = await db.get(claim._id);
                await db.remove(doc);
                syncedCount++;
            }
        }

        return { success: true, message: `Successfully synced ${syncedCount} claims!` };
    } catch (error) {
        console.error('Sync Error:', error);
        return { success: false, message: 'An error occurred during synchronization.' };
    }
};