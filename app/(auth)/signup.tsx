import { useState } from 'react';
import { 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Alert, 
  View, 
  Text,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { authApi } from '@/utils/api';

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !age || !gender || !phone || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    const ageNumber = parseInt(age);
    if (isNaN(ageNumber) || ageNumber < 0 || ageNumber > 120) {
      Alert.alert('Error', 'Please enter a valid age');
      return;
    }

    if (!['male', 'female', 'other'].includes(gender.toLowerCase())) {
      Alert.alert('Error', 'Gender must be male, female, or other');
      return;
    }

    // Add phone validation
    const phoneRegex = /^\d{10}$/;  // Assumes 10-digit phone number
    if (!phoneRegex.test(phone)) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.signup({
        first_name: firstName,

        last_name: lastName,
        email: email.toLowerCase(),
        age: ageNumber,
        gender: gender.toLowerCase() as 'male' | 'female' | 'other',
        phone: phone,
        password,
      });

      if (response.success && response.access_token) {
        await AsyncStorage.setItem('userToken', response.access_token);
        router.replace('/(tabs)/home' as const);
      } else {
        throw new Error(response.error || 'Failed to create account');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create account. Please try again.'
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
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={[styles.title, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
                Create Account
              </Text>
              <Text style={[styles.subtitle, { color: colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight }]}>
                Please fill in the details to sign up
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={[
                  styles.input,
                  { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                  { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
              />
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={[
                  styles.input,
                  { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                  { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
              />

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
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                style={[
                  styles.input,
                  { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                  { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
              />
              <TextInput
                placeholder="Gender"
                value={gender}
                onChangeText={setGender}
                style={[
                  styles.input,
                  { color: colorScheme === 'dark' ? Colors.darkText : Colors.text },
                  { backgroundColor: colorScheme === 'dark' ? Colors.darkSecondary : Colors.secondary },
                ]}
                placeholderTextColor={colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight}
              />  
              <TextInput
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
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
              onPress={handleSignup} 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={styles.link}>Login</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
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
    color: Colors.text,
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
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});