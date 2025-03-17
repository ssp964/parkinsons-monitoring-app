import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FinishTest() {
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      // Clear all test data from AsyncStorage
      await AsyncStorage.multiRemove([
        '@memory_data',
        '@delayed_recall_data',
        '@orientation_data',
        '@visuospatial_clock_data'
      ]);

      Alert.alert(
        'Success',
        'Test completed successfully!',
        [
          {
            text: 'Return Home',
            onPress: () => router.push('/(tabs)/home')
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Test</Text>
      <Text style={styles.description}>
        You have completed all sections of the MoCA test. 
        Press submit to finish the test.
      </Text>
      
      <Pressable
        style={styles.submitButton}
        onPress={handleSubmit}
      >
        <Text style={styles.submitButtonText}>Submit Test</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.text,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
});