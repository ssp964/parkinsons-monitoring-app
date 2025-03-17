import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';  
import Colors from '@/constants/Colors';
// ...existing imports...
import { Ionicons } from '@expo/vector-icons';


export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? Colors.darkBackground : Colors.background
        }
      }}>
        <Stack.Screen name="index" />
        <Stack.Screen 
          name="(auth)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(moca)" 
          options={{ headerShown: false }} 
        />
        // Add to your navigation stack or tabs
<Stack.Screen
  name="storage-viewer"
  options={{ headerShown: false }} 
  />
      </Stack>
    </ThemeProvider>
  );
}
