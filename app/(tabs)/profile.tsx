import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  useColorScheme,
  Pressable,
  StatusBar,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { authApi } from '@/utils/api';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  gender: string;
  phone: string;
  patient_id: string;
}

interface InfoItemProps {
  label: string;
  value: string;
  colorScheme: 'light' | 'dark' | null | undefined;  // Updated type to match useColorScheme return type
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch profile');
      }
    } catch (error: any) {
      console.error('Profile error:', error);
      Alert.alert('Error', error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authApi.logout();
      router.replace('/(auth)/login' as const);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
          Failed to load profile
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { 
      backgroundColor: colorScheme === 'dark' ? Colors.darkBackground : Colors.background 
    }]}>
      <ScrollView style={styles.container}>
        <View style={styles.profileSection}>
          <Text style={[styles.header, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
            Profile Information
          </Text>
          
          <View style={styles.infoContainer}>
            <InfoItem 
              label="Patient ID"
              value={profile.patient_id}
              colorScheme={colorScheme}
            />
            <InfoItem 
              label="Name"
              value={`${profile.first_name} ${profile.last_name}`}
              colorScheme={colorScheme}
            />
            <InfoItem 
              label="Email"
              value={profile.email}
              colorScheme={colorScheme}
            />
            <InfoItem 
              label="Age"
              value={profile.age.toString()}
              colorScheme={colorScheme}
            />
            <InfoItem 
              label="Gender"
              value={profile.gender}
              colorScheme={colorScheme}
            />
            <InfoItem 
              label="Phone"
              value={profile.phone}
              colorScheme={colorScheme}
            />
          </View>
        </View>
      </ScrollView>

      <Pressable 
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const InfoItem = ({ label, value, colorScheme }: InfoItemProps) => (
  <View style={styles.infoRow}>
    <Text style={[styles.label, { color: colorScheme === 'dark' ? Colors.darkTextLight : Colors.textLight }]}>
      {label}
    </Text>
    <Text style={[styles.value, { color: colorScheme === 'dark' ? Colors.darkText : Colors.text }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  profileSection: {
    padding: 20,
    paddingTop: StatusBar.currentHeight || 50, // Add padding for status bar
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  signOutButton: {
    backgroundColor: Colors.primary,
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 40 : 20, // Extra padding for iOS
  },
  signOutText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});