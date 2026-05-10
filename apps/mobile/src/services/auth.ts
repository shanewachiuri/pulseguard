import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const loginUser = async (phone: string) => {
  // Standardize to Kenyan 254 format
  let formatted = phone.replace(/\s/g, '');
  if (formatted.startsWith('0')) {
    formatted = '254' + formatted.slice(1);
  } else if (formatted.startsWith('+')) {
    formatted = formatted.slice(1);
  }

  // Use localStorage for Web testing, SecureStore for Mobile
  if (Platform.OS === 'web') {
    localStorage.setItem('user_phone', formatted);
  } else {
    await SecureStore.setItemAsync('user_phone', formatted);
  }
  
  return formatted;
};

export const getUserPhone = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('user_phone');
  }
  return await SecureStore.getItemAsync('user_phone');
};

export const logoutUser = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('user_phone');
  } else {
    await SecureStore.deleteItemAsync('user_phone');
  }
};