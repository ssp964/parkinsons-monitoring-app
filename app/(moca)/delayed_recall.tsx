import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { DelayedResponse } from '@/constants/database';

const EXPECTED_RESPONSES = ['Face', 'Velvet', 'Daisy', 'Red', 'Church'];

export default function DelayedRecallTest() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [showInstruction, setShowInstruction] = useState(true);
  const [delayedResponse, setDelayedResponse] = useState<DelayedResponse>({
    expected_responses: EXPECTED_RESPONSES,
    actual_responses: []
  });
  const [isTestComplete, setIsTestComplete] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = (error) => {
      console.error('Speech recognition error:', error);
      setIsRecording(false);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speakInstruction = async () => {
    setIsSpeaking(true);
    try {
      await Speech.speak(
        "I read some words to you earlier, which I asked you to remember. Tell me as many of those words as you can remember.",
        {
          rate: 0.8,
          onDone: () => {
            setIsSpeaking(false);
            setShowInstruction(false);
          }
        }
      );
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
    try {
      await Voice.start('en-US');
      setIsRecording(true);
      setSpokenText('');
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

      if (spokenText) {
        const words = spokenText.toLowerCase().split(' ').filter(word => word.length > 0);
        
        const newResponse: DelayedResponse = {
          expected_responses: EXPECTED_RESPONSES,
          actual_responses: words
        };

        setDelayedResponse(newResponse);
        setIsTestComplete(true);

        // Debug output
        console.log('\nDelayed Recall Results:');
        console.log('Expected responses:', EXPECTED_RESPONSES);
        console.log('Actual responses:', words);
        console.log('Matches:', EXPECTED_RESPONSES.filter(word => 
          words.includes(word.toLowerCase())
        ));

        // Store in AsyncStorage
        await AsyncStorage.setItem('@delayed_recall_data', JSON.stringify(newResponse));
        console.log('Data saved to AsyncStorage');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to save recording');
    }
  };

  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      setSpokenText(e.value[0]);
    }
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const handleNext = () => {
    router.push({
      pathname: '/(moca)/orientation',
      params: { delayedRecall: JSON.stringify(delayedResponse) }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delayed Recall</Text>

      {showInstruction ? (
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            Memory Recall Test
          </Text>
          <Pressable
            style={[styles.button, isSpeaking && styles.buttonDisabled]}
            onPress={speakInstruction}
            disabled={isSpeaking}
          >
            <Ionicons 
              name={isSpeaking ? "volume-high" : "play"} 
              size={24} 
              color={Colors.textLight} 
            />
            <Text style={styles.buttonText}>
              {isSpeaking ? 'Speaking...' : 'Start Test'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.recordingContainer}>
          
          
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

          
            <Pressable 
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>Continue</Text>
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
    textAlign: 'center',
    marginBottom: 20,
    color: Colors.textLight,
  },
  recordingContainer: {
    alignItems: 'center',
    gap: 20,
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
  spokenText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  resultsContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  nextButtonText: {
    color: Colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  }
});