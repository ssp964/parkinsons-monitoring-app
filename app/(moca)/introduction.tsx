import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function MoCAIntroduction() {
  const startTest = () => {
    router.push('/(moca)/trailmaking');  // Change this line
  };

  const handleBack = () => {
    router.back();
  };

  const handleHome = () => {
    router.push('/(tabs)/home');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleHome} style={styles.homeButton}>
              <Ionicons name="home" size={24} color={Colors.text} />
            </Pressable>
          ),
          title: 'MoCA Test',
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Montreal Cognitive Assessment</Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.description}>
            The MoCA test is a cognitive screening tool that helps assess different 
            cognitive domains including:
          </Text>
          
          <View style={styles.listContainer}>
            <Text style={styles.listItem}>• Visuospatial/Executive functions</Text>
            <Text style={styles.listItem}>• Naming ability</Text>
            <Text style={styles.listItem}>• Memory</Text>
            <Text style={styles.listItem}>• Attention</Text>
            <Text style={styles.listItem}>• Language</Text>
            <Text style={styles.listItem}>• Abstract thinking</Text>
            <Text style={styles.listItem}>• Orientation</Text>
          </View>

          <Text style={styles.instruction}>
            The test will take approximately 10-15 minutes to complete.
          </Text>
        </View>

        <Pressable style={styles.button} onPress={startTest}>
          <Text style={styles.buttonText}>Start Test</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 15,
    lineHeight: 24,
  },
  listContainer: {
    marginLeft: 10,
    marginBottom: 15,
  },
  listItem: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  instruction: {
    fontSize: 16,
    color: Colors.text,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    marginLeft: 16,
    padding: 8,
  },
  homeButton: {
    marginRight: 16,
    padding: 8,
  },
});