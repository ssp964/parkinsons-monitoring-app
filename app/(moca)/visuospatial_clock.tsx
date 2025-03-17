import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Colors from '@/constants/Colors';
import { VisuospatialClockResponse } from '@/constants/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VisuospatialClock() {
  const [imageUri, setImageUri] = useState<string>('');
  const router = useRouter();

  const takePicture = async () => {
    try {
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Crop and resize to 420x420
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [
            { resize: {
              width: 420,
              height: 420
            }}
          ],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        setImageUri(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error selecting picture:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const generateImageId = (): string => {
    return `CLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleNext = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please upload the clock drawing first');
      return;
    }

    const image_id = generateImageId();
    const clockResponse: VisuospatialClockResponse = {
      image_id: image_id,
      image_uri: imageUri,
      actual_responses: [image_id], // Add image_id to actual_responses
      timestamp: new Date().toISOString()
    };

    try {
      // Store in AsyncStorage for debugging
      await AsyncStorage.setItem('@visuospatial_clock_data', JSON.stringify(clockResponse));
      
      // Enhanced debug logging
      console.log('\nVisuospatial Clock Test Data:');
      console.log('Image ID:', image_id);
      console.log('Image URI:', imageUri);
      console.log('Actual Responses:', clockResponse.actual_responses);
      console.log('Full Response:', JSON.stringify(clockResponse, null, 2));
      
      // Verify storage
      const storedData = await AsyncStorage.getItem('@visuospatial_clock_data');
      console.log('\nVerifying stored data:');
      console.log(JSON.parse(storedData || '{}'));

      router.push({
        pathname: '/(moca)/naming',
        params: { visuospatial_clock: JSON.stringify(clockResponse) }
      });
    } catch (error) {
      console.error('Error saving clock test data:', error);
      Alert.alert('Error', 'Failed to save test data');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Visuospatial Clock Test</Text>
      
      <View style={styles.instructionContainer}>
        <Text style={styles.instruction}>
          Draw a clock. Put in all the numbers and set the time to 10 past 30.
        </Text>
        
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: imageUri }} 
              style={styles.capturedImage} 
            />
            <Pressable
              style={styles.retakeButton}
              onPress={takePicture}
            >
              <Ionicons name="image" size={24} color={Colors.textLight} />
              <Text style={styles.buttonText}>Select Different Image</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.button}
            onPress={takePicture}
          >
            <Ionicons name="image" size={24} color={Colors.textLight} />
            <Text style={styles.buttonText}>Upload Image</Text>
          </Pressable>
        )}
        
        {imageUri && (
          <Pressable 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 20,
  },
  instruction: {
    fontSize: 18,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
    aspectRatio: 1,
  },
  camera: {
    flex: 1,
  },
  cameraBorder: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 20,
  },
  captureButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    width: 320, // Reduced from 420
    height: 320, // Reduced from 420
    marginVertical: 10, // Reduced from 20
    marginBottom: 20, // Added more bottom margin
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    gap: 10,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error,
    padding: 15,
    borderRadius: 8,
    gap: 10,
    marginTop: 15,
    marginBottom: 20, // Added bottom margin
  },
  nextButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginTop: 30, // Increased top margin
    width: '100%', // Make button full width
    alignItems: 'center', // Center the text
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
});