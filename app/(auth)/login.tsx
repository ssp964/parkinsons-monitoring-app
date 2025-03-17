import { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Alert, 
  View, 
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { authApi, testDatabaseConnection } from '@/utils/api';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const connected = await testDatabaseConnection();
      setIsConnected(connected);
      if (!connected) {
        Alert.alert(
          'Connection Error',
          'Unable to connect to the server. Please check your connection and try again.'
        );
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setIsConnected(false);
    }
  };

  const handleLogin = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'No connection to server. Please try again.');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({
        email: email.toLowerCase(),
        password,
      });

      if (response.success && response.access_token) {
        await AsyncStorage.setItem('userToken', response.access_token);
        router.replace('/(tabs)/home' as const);
      } else {
        throw new Error(response.error || 'Failed to login');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        error.message || 'Invalid email or password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? Colors.darkBackground : Colors.background }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight }]}>
              Please sign in to continue
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[
                styles.input,
                { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
              ]}
              placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={[
                styles.input,
                { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
              ]}
              placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
            />
          </View>

          <Pressable 
            onPress={handleLogin} 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, { color: Colors.text }]}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
              Don't have an account?{' '}
            </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text style={[styles.link, { color: Colors.primary }]}>Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    gap: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
  },
  inputContainer: {
    gap: 16,
    marginBottom: 24,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 48,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 16,
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
  },
});