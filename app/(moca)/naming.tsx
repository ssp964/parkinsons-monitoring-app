import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { NAMING_QUESTIONS } from '@/constants/TestQuestions';

interface AnswerResult {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}

const getImageSource = (index: number) => {
  switch (index) {
    case 0:
      return require('@/assets/images/moca/lion.png');
    case 1:
      return require('@/assets/images/moca/rhino.png');
    case 2:
      return require('@/assets/images/moca/camel.png');
    default:
      return null;
  }
};

export default function NamingTest() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    // Initialize voice recognition
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = (error: { error?: { message?: string } }) => {
      console.error('Speech recognition error:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to recognize speech. Please try again.');
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      const text = e.value[0].toLowerCase().trim();
      setSpokenText(text);
    }
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      await Voice.destroy();
      setIsRecording(true);
      setSpokenText('');
      await Voice.start('en-US');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start speech recognition');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    try {
      await Voice.stop();
      setIsRecording(false);
      
      if (spokenText) {
        setResponses(prev => [...prev, spokenText]);
        
        if (currentQuestionIndex < NAMING_QUESTIONS.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          setIsTestComplete(true);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  if (isTestComplete) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Test Complete</Text>
        
        <View style={styles.completionContainer}>
          <Ionicons 
            name="checkmark-circle" 
            size={64} 
            color={Colors.success} 
          />
          
          <Text style={styles.instruction}>
            Your responses have been recorded:
          </Text>

          <View style={styles.resultsContainer}>
            {responses.map((response, index) => (
              <View key={index} style={styles.responseItem}>
                <Text style={styles.responseLabel}>Image {index + 1}:</Text>
                <Text style={styles.responseText}>{response}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={styles.nextButton}
            onPress={() => router.push({
              pathname: '/(moca)/memory',
              params: { responses: JSON.stringify(responses) }
            })}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={24} color={Colors.textLight} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Naming Test</Text>
      <Text style={styles.instruction}>
        Please name the animal shown in the image
      </Text>

      <View style={styles.imageContainer}>
        <Image
          source={getImageSource(currentQuestionIndex)}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentQuestionIndex + 1} of {NAMING_QUESTIONS.length}
        </Text>
      </View>

      {spokenText ? (
        <Text style={styles.spokenText}>You said: {spokenText}</Text>
      ) : null}

      <Pressable
        style={[styles.recordButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Ionicons
          name={isRecording ? "stop-circle" : "mic"}
          size={24}
          color={Colors.white}
        />
        <Text style={styles.buttonText}>
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </Pressable>
    </View>
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
  instruction: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    marginBottom: 20,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textLight,
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  recordingComplete: {
    fontSize: 16,
    color: Colors.success,
    textAlign: 'center',
    marginTop: 10,
  },
  spokenText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  startContainer: {
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  recordingStatusText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 8,
  },
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 24,
  },
  resultsContainer: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  responseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  responseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
    width: 80,
  },
  responseText: {
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    gap: 8,
    marginTop: 20,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textLight,
  }
});