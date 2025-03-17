import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SentenceRepetition } from '@/constants/database';

const SENTENCES = {
  sentence_1: "I only know that John is the one to help today",
  sentence_2: "The cat always hid under the couch when dogs were in the room"
};

export default function SentenceRepetitionTest() {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [responses, setResponses] = useState<string[]>([]);
  const [showInstruction, setShowInstruction] = useState(true);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speakInstruction = async () => {
    setIsSpeaking(true);
    const instruction = currentSentenceIndex === 1
      ? "I am going to read you a sentence. Repeat it after me, exactly as I say it"
      : "Now I am going to read you another sentence. Repeat it after me, exactly as I say it";

    try {
      await Speech.speak(instruction, {
        language: 'en',
        rate: 0.6,
        onDone: () => {
          setTimeout(() => {
            speakSentence();
          }, 1000);
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const speakSentence = async () => {
    const sentence = currentSentenceIndex === 1 ? SENTENCES.sentence_1 : SENTENCES.sentence_2;
    try {
      await Speech.speak(sentence, {
        language: 'en',
        rate: 0.6,
        onDone: () => {
          setIsSpeaking(false);
          setShowInstruction(false);
        }
      });
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
        // Debug: Log current response
        console.log(`Recording stopped. Current response: ${spokenText}`);
        
        setResponses(prev => {
          const newResponses = [...prev, spokenText];
          // Debug: Log all responses after update
          console.log('Updated responses array:', newResponses);
          return newResponses;
        });

        if (currentSentenceIndex === 1) {
          // Debug: Log first sentence completion
          console.log('First sentence completed. Response stored:', spokenText);
          setCurrentSentenceIndex(2);
          setShowInstruction(true);
          setSpokenText('');
        } else {
          // Debug: Log final results
          const sentenceData: SentenceRepetition = {
            expected_responses: [SENTENCES.sentence_1, SENTENCES.sentence_2],
            actual_responses: [...responses, spokenText]
          };

          console.log('\nSentence Repetition Test Results:');
          console.log('Expected responses:', sentenceData.expected_responses);
          console.log('Actual responses:', sentenceData.actual_responses);

          await AsyncStorage.setItem('@sentence_repetition_data', 
            JSON.stringify(sentenceData)
          );

          // Debug: Log storage confirmation
          console.log('Data saved to AsyncStorage');

          router.push({
            pathname: '/(moca)/delayed_recall',
            params: { 
              sentenceRepetition: JSON.stringify(sentenceData)
            }
          });
        }
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleNext = () => {
    if (currentSentenceIndex === 1) {
      setCurrentSentenceIndex(2);
      setShowInstruction(true);
      setSpokenText('');
    } else {
      // Save and navigate on second sentence completion
      const sentenceData: SentenceRepetition = {
        expected_responses: [SENTENCES.sentence_1, SENTENCES.sentence_2],
        actual_responses: [...responses, spokenText]
      };

      AsyncStorage.setItem('@sentence_repetition_data', JSON.stringify(sentenceData))
        .then(() => {
          router.push({
            pathname: '/(moca)/delayed_recall',
            params: { sentenceRepetition: JSON.stringify(sentenceData) }
          });
        })
        .catch(error => {
          console.error('Failed to save data:', error);
          Alert.alert('Error', 'Failed to save test data');
        });
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sentence Repetition</Text>

      {showInstruction ? (
        <View style={styles.instructionContainer}>
          <Text style={styles.instruction}>
            Sentence {currentSentenceIndex}
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
              {isSpeaking ? 'Speaking...' : 'Play Instructions'}
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
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.buttonText}>
                {currentSentenceIndex === 1 ? 'Next Sentence' : 'Continue'}
              </Text>
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
  nextButton: {
    backgroundColor: Colors.primary,
    marginTop: 20,
    width: '100%',
  },
});