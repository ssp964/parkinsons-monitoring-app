import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { NAMING_QUESTIONS } from '@/constants/TestQuestions';
import { Asset } from 'expo-asset';

const getLocalImage = (imagePath: string) => {
  switch (imagePath) {
    case 'lion':
      return require('@/assets/images/moca/lion.png');
    case 'camel':
      return require('@/assets/images/moca/camel.png');
    case 'rhino':
      return require('@/assets/images/moca/rhino.png');
  }
};

function NamingTest() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<{ [key: string]: Audio.Recording }>({});
  const recording = useRef<Audio.Recording | null>(null);

  const currentQuestion = NAMING_QUESTIONS[currentQuestionIndex];

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recording.current = newRecording;
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording.current) return;

    try {
      await recording.current.stopAndUnloadAsync();
      setRecordings({
        ...recordings,
        [currentQuestion.question_id]: recording.current
      });
      setIsRecording(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < NAMING_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Test completed
      router.push('/(moca)/introduction');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.questionContainer}>
        <Image
          source={getLocalImage(currentQuestion.image_url)}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.controlsContainer}>
        <Text style={styles.instructions}>
          Please name the animal shown in the image
        </Text>

        <Pressable
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.buttonText}>
            {isRecording ? 'Recording...' : 'Hold to Record'}
          </Text>
        </Pressable>

        {recordings[currentQuestion.question_id] && (
          <Text style={styles.recordingComplete}>Recording saved ✓</Text>
        )}

        <Pressable
          style={[
            styles.nextButton,
            !recordings[currentQuestion.question_id] && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!recordings[currentQuestion.question_id]}
        >
          <Text style={styles.buttonText}>
            {currentQuestionIndex === NAMING_QUESTIONS.length - 1 ? 'Finish' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  questionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
  },
  controlsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  instructions: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.text,
    marginLeft: 10,
    fontSize: 16,
  },
  recordingComplete: {
    color: Colors.success,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default NamingTest;