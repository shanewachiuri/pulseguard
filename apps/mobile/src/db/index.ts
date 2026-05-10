/// <reference lib="esnext" />
import 'react-native-get-random-values';

// @ts-ignore
import { decode, encode } from 'base-64';

// Polyfills for React Native PouchDB compatibility
if (!(globalThis as any).btoa) {
    (globalThis as any).btoa = encode;
}
if (!(globalThis as any).atob) {
    (globalThis as any).atob = decode;
}

import { Platform } from 'react-native';
import PouchDB from 'pouchdb-core';
import HttpPouch from 'pouchdb-adapter-http';
import mapreduce from 'pouchdb-mapreduce';

// 1. Core plugins
PouchDB.plugin(HttpPouch);
PouchDB.plugin(mapreduce);

// 2. Platform-specific storage adapters
if (Platform.OS === 'web') {
  // Use IndexedDB for the web browser
  const idb = require('pouchdb-adapter-idb');
  PouchDB.plugin(idb.default || idb);
} else {
  // Use AsyncStorage for native iOS/Android
  const asyncStorage = require('pouchdb-adapter-asyncstorage');
  PouchDB.plugin(asyncStorage.default || asyncStorage);
}

// 3. Initialize the database with the correct adapter
const db = new PouchDB('pulseguard_local', {
  adapter: Platform.OS === 'web' ? 'idb' : 'asyncstorage',
});

// 4. Type Definitions
export interface LocalClaim {
    _id: string;
    _rev?: string; 
    type: 'claim';
    syncStatus: 'pending' | 'synced';
    policyId?: string;
    imageUri: string;
    timestamp: string;
}

/**
 * Saves a claim to the local PouchDB instance.
 */
export const savePendingClaim = async (policyId: string, imageUri: string) => {
    const timestamp = new Date().toISOString();
    const doc: LocalClaim = {
        _id: `claim_${timestamp}`, 
        type: 'claim',
        syncStatus: 'pending',
        policyId,
        imageUri,
        timestamp
    };
    return await db.put(doc);
};

/**
 * Generic save helper
 */
export const saveClaim = async (claimData: Partial<LocalClaim>) => {
  try {
    const timestamp = new Date().toISOString();
    const response = await db.post({
      ...claimData,
      type: 'claim',
      syncStatus: 'pending',
      timestamp: timestamp
    });
    return response;
  } catch (error) {
    console.error('Error saving claim locally', error);
    throw error;
  }
};

/**
 * Fetches all claims that are currently in 'pending' status.
 */
export const getPendingClaims = async (): Promise<LocalClaim[]> => {
    try {
        const allDocs = await db.allDocs({ include_docs: true, descending: true });
        
        return allDocs.rows
            .map((row: any) => row.doc as unknown as LocalClaim)
            .filter((doc: LocalClaim) => {
                return doc && doc.type === 'claim' && doc.syncStatus === 'pending';
            });
    } catch (error) {
        console.error('Error fetching pending claims', error);
        return [];
    }
};

export default db;