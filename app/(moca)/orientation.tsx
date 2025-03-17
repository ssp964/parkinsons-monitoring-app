import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import { OrientationResponse } from '../../constants/database';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Orientation() {
  // Move helper functions before state initialization
  const getCurrentDateResponses = (): string[] => {
    const now = new Date();
    return [
      now.getFullYear().toString(),
      now.toLocaleString('default', { month: 'long' }),
      now.toLocaleString('default', { weekday: 'long' })
    ];
  };

  const calculateScore = (actual: string[], expected: string[]): number => {
    return actual.reduce((score, response, index) => {
      return response.toLowerCase() === expected[index].toLowerCase() ? score + 1 : score;
    }, 0);
  };

  // State initialization after helper functions
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [showInstruction, setShowInstruction] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [orientationResponse, setOrientationResponse] = useState<OrientationResponse>({
    expected_responses: getCurrentDateResponses(),
    actual_responses: [],
    score: 0
  });
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [accumulatedText, setAccumulatedText] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const setupVoice = async () => {
      try {
        await Voice.destroy();
        Voice.onSpeechResults = onSpeechResults;
        Voice.onSpeechEnd = () => {
          console.log('Speech recognition ended');
          setIsRecording(false);
        };
        Voice.onSpeechError = (error) => {
          console.error('Speech recognition error:', error);
          setIsRecording(false);
        };
      } catch (error) {
        console.error('Error setting up Voice:', error);
      }
    };

    setupVoice();
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startTest = () => {
    setShowInstruction(false);
  };

  const startRecording = async () => {
    try {
      await Voice.destroy();
      setSpokenText('');
      setAccumulatedText([]);
      const isAvailable = await Voice.isAvailable();
      if (!isAvailable) {
        Alert.alert('Error', 'Speech recognition is not available');
        return;
      }
      await Voice.start('en-US');
      setIsRecording(true);
      console.log('Started recording');
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start speech recognition');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    try {
      await Voice.stop();
      setIsRecording(false);
      console.log('Stopped recording');
      
      // Process the accumulated responses
      if (accumulatedText.length > 0) {
        const finalResponse = accumulatedText[accumulatedText.length - 1];
        const newResponses = [...orientationResponse.actual_responses];
        newResponses[currentQuestionIndex] = finalResponse.trim();
        
        setOrientationResponse(prev => ({
          ...prev,
          actual_responses: newResponses
        }));

        // Debug logging
        console.log('\nResponse captured:');
        console.log('Question:', questions[currentQuestionIndex]);
        console.log('Response:', finalResponse.trim());

        // Move to next question or complete test
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setAccumulatedText([]);
          setSpokenText('');
        } else {
          const score = calculateScore(newResponses, orientationResponse.expected_responses);
          setOrientationResponse(prev => ({
            ...prev,
            actual_responses: newResponses,
            score: score
          }));
          setIsTestComplete(true);
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      const newResponse = e.value[0];
      console.log('Speech recognized:', newResponse);
      setSpokenText(newResponse);
      setAccumulatedText(prev => [...prev, newResponse]);
    }
  };

  const handleNext = () => {
    // Debug logging before navigation
    console.log('\nFinal Orientation Test Data:');
    console.log(JSON.stringify(orientationResponse, null, 2));
    
    router.push({
      pathname: '/(moca)/finish',
      params: { orientation: JSON.stringify(orientationResponse) }
    });
  };

  const questions = [
    'What year is it?',
    'What month is it?',
    'What day of the week is it?'
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orientation</Text>

      {showInstruction ? (
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            Please answer the following questions about time.
          </Text>
          <Pressable
            style={styles.button}
            onPress={startTest}
          >
            <Ionicons 
              name="play"
              size={24} 
              color={Colors.textLight} 
            />
            <Text style={styles.buttonText}>Start Test</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.recordingContainer}>
          <Text style={styles.question}>{questions[currentQuestionIndex]}</Text>
          {isRecording && (
            <Text style={styles.recordingIndicator}>Recording in progress...</Text>
          )}
          
          <Pressable
            style={[styles.button, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons
              name={isRecording ? "stop-circle" : "mic"}
              size={24}
              color={Colors.textLight}
            />
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </Pressable>
        </View>
      )}

      {isTestComplete && (
        <View style={styles.resultsContainer}>
          <Pressable 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
          </Pressable>
        </View>
      )}
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
    marginBottom: 30,
    textAlign: 'center',
    color: Colors.textLight,
  },
  instructionContainer: {
    alignItems: 'center',
    gap: 20,
  },
  instruction: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.textLight,
  },
  questionContainer: {
    alignItems: 'center',
    gap: 20,
  },
  question: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: Colors.textLight,
  },
  response: {
    fontSize: 18,
    marginBottom: 20,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    gap: 10,
    marginBottom: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  recordingButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  completedText: {
    fontSize: 18,
    color: 'green',
    textAlign: 'center',
    marginTop: 20,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordingText: {
    fontSize: 16,
    color: Colors.error,
  },
  recordingContainer: {
    alignItems: 'center',
    gap: 20,
  },
  spokenText: {
    fontSize: 18,
    marginBottom: 20,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  resultsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  responsesContainer: {
    alignItems: 'center',
    gap: 10,
  },
  responseTitle: {
    fontSize: 18,
    color: Colors.textLight,
    fontWeight: 'bold',
  }
});