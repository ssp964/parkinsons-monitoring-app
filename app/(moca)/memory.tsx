import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';

const EXPECTED_RESPONSES = ['Face', 'Velvet', 'Daisy', 'Red', 'Church'];

interface MemoryResponses {
  expected_responses: string[];
  actual_responses: string[][];
}

export default function MemoryTest() {
  const [currentTrial, setCurrentTrial] = useState<1 | 2>(1);
  const [memoryData, setMemoryData] = useState<MemoryResponses>({
    expected_responses: EXPECTED_RESPONSES,
    actual_responses: [[], []] // Array for trial 1 and trial 2
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [isTrialFinished, setIsTrialFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Add a ref to track current trial responses
  const trialRef = useRef(1);

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Update useEffect to watch currentTrial changes
  useEffect(() => {
    trialRef.current = currentTrial;
  }, [currentTrial]);

  const speakWords = async () => {
    setIsSpeaking(true);
    
    for (const word of EXPECTED_RESPONSES) {
      await Speech.speak(word, {
        rate: 0.8,
        onDone: () => console.log('Finished speaking:', word),
      });
      // Wait 1 second between words
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsSpeaking(false);
  };

  const startRecording = async () => {
    try {
      console.log(`Starting recording for Trial ${currentTrial}`);
      await Voice.start('en-US');
      setIsRecording(true);
      setSpokenText('');
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  // Update the stopRecording function
  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
      // Make sure we have the latest responses
      if (memoryData.actual_responses[currentTrial - 1].length > 0) {
        setSpokenText(memoryData.actual_responses[currentTrial - 1].join(' '));
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Update onSpeechResults handler to keep spokenText updated
  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      const text = e.value[0].toLowerCase();
      setSpokenText(text); // Keep this
      const words = text.split(' ').filter(word => word.length > 0);
      
      setMemoryData(prev => {
        const newResponses = [...prev.actual_responses];
        const trialIndex = trialRef.current - 1;
        
        if (trialIndex === 1) {
          console.log('Recording Trial 2:', words);
          newResponses[1] = words;
        } else {
          console.log('Recording Trial 1:', words);
          newResponses[0] = words;
        }
        
        return {
          ...prev,
          actual_responses: newResponses
        };
      });
    }
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  // Update handleNext
  const handleNext = () => {
    if (currentTrial === 1) {
      const trial1Data = [...memoryData.actual_responses[0]]; // Create copy
      console.log('Completing Trial 1:', trial1Data);
      
      setCurrentTrial(2);
      setSpokenText('');
      setIsRecording(false);
      
      // Preserve trial 1 responses when moving to trial 2
      setMemoryData(prev => ({
        ...prev,
        actual_responses: [trial1Data, []]
      }));
    }
  };

  // Update handleFinish
  const handleFinish = async () => {
    try {
      console.log('\nMemory Test Final Results:');
      console.log('Expected:', EXPECTED_RESPONSES);
      console.log('Trial 1:', memoryData.actual_responses[0]);
      console.log('Trial 2:', memoryData.actual_responses[1]);

      await AsyncStorage.setItem('@memory_data', JSON.stringify(memoryData));
      
      router.push({
        pathname: "/(moca)/attention",
        params: { memoryData: JSON.stringify(memoryData) }
      });
    } catch (error) {
      console.error('Failed to save memory data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Memory Test - Trial {currentTrial}</Text>

      {!isTrialFinished && (
        <>
          <Pressable
            style={[styles.button, isSpeaking && styles.buttonDisabled]}
            onPress={speakWords}
            disabled={isSpeaking}
          >
            <Text style={styles.buttonText}>
              {isSpeaking ? 'Speaking...' : 'Speak Words'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </Pressable>

        

          {!isRecording  && (
            <Pressable
              style={[
                styles.button,
                currentTrial === 2 ? styles.finishButton : styles.nextButton
              ]}
              onPress={currentTrial === 1 ? handleNext : handleFinish}
            >
              <Text style={styles.buttonText}>
                {currentTrial === 1 ? 'Next Trial' : 'Finish Test'}
              </Text>
            </Pressable>
          )}
        </>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  word: {
    fontSize: 18,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  recordingButton: {
    backgroundColor: Colors.error,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  responseText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  responsesContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  responseHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.text,
  },
  summaryContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    width: '100%',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: Colors.text,
  },
  summaryText: {
    fontSize: 16,
    marginVertical: 5,
    paddingLeft: 10,
    color: Colors.text,
  },
  finishButton: {
    backgroundColor: Colors.success,
    marginTop: 20,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    marginTop: 20,
  },
  trialContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: Colors.text,
  },
  reminderContainer: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  reminderText: {
    fontSize: 16,
    color: '#E65100',
    fontWeight: '500',
  }
});