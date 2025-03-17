import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import Voice, { SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';

// Update EXPECTED_RESPONSES to use words
const EXPECTED_RESPONSES_BS = ["6", "5", "8", "9", "4"];

interface AttentionBSResponses {
  expected_responses: string[];
  actual_responses: string[];
}

export default function AttentionTest() {
  const [attentionData, setAttentionData] = useState<AttentionBSResponses>({
    expected_responses: EXPECTED_RESPONSES_BS,
    actual_responses: []
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);
  const [responses, setResponses] = useState<string[]>([]);
  const [lastStoredResponse, setLastStoredResponse] = useState('');

  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = onSpeechEnd;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const speakNumbers = async () => {
    setIsSpeaking(true);
    setShowInstructions(false);
    
    // First speak the instruction
    await Speech.speak(
      "Now I am going to say some more numbers, but when I am through you must repeat them to me in the backwards order",
      { rate: 0.7 }
    );
    
    // Wait 2 seconds after instruction
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Then speak each number with 1 second gap
    for (const number of EXPECTED_RESPONSES_BS) {
      await Speech.speak(number, {
        rate: 0.2,
        onDone: () => console.log('Finished speaking:', number),
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsSpeaking(false);
  };

  // Simplify startRecording to reset states
  const startRecording = async () => {
    try {
      setResponses([]);
      setSpokenText('');
      setAttentionData(prev => ({
        ...prev,
        actual_responses: []
      }));
      await Voice.start('en-US');
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Update onSpeechResults to handle responses directly
  const onSpeechResults = (e: SpeechResultsEvent) => {
    if (e.value) {
      const currentText = e.value[0].toLowerCase().trim();
      
      // Add comma between responses when there's a pause
      setSpokenText(prev => {
        if (prev && currentText !== prev) {
          return `${prev}, ${currentText}`;
        }
        return currentText;
      });

      // Update responses array with comma-separated values
      const responses = currentText.split(',').map(text => text.trim());
      setResponses(responses);
      
      // Update attention data
      setAttentionData(prev => ({
        ...prev,
        actual_responses: responses
      }));

      console.log('Current text:', currentText);
    }
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  // Add validation before finishing
  const handleFinish = async () => {
    try {
      // Check if we have responses
      if (attentionData.actual_responses.length === 0) {
        Alert.alert('Error', 'Please record your response first');
        return;
      }

      console.log('\nBackward Span Test Results:');
      console.log('Expected:', EXPECTED_RESPONSES_BS);
      console.log('Actual:', attentionData.actual_responses);

      // Store in AsyncStorage with correct key
      await AsyncStorage.setItem('@attention_bs_data', JSON.stringify(attentionData));
      
      // Navigate to next test
      router.push({
        pathname: "/(moca)/sentence_repetition",
        params: { attentionData: JSON.stringify(attentionData) }
      });
    } catch (error) {
      console.error('Failed to save attention data:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backward Span</Text>

      {showInstructions && (
        <Text style={styles.instructions}>
          Now I am going to say some more numbers, but when I am through you must repeat them to me in the backwards order
        </Text>
      )}

      <Pressable
        style={[styles.button, isSpeaking && styles.buttonDisabled]}
        onPress={speakNumbers}
        disabled={isSpeaking}
      >
        <Text style={styles.buttonText}>
          {isSpeaking ? 'Speaking...' : 'Start Test'}
        </Text>
      </Pressable>

      {!showInstructions && (
        <>
          <Pressable
            style={[styles.button, isRecording && styles.recordingButton]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Text>
          </Pressable>


        </>
      )}

    
          
              
              
              <Pressable
                style={[styles.button, styles.finishButton]}
                onPress={handleFinish}
              >
                <Text style={styles.buttonText}>Next</Text>
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
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    color: Colors.text,
    lineHeight: 24,
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
  finishButton: {
    backgroundColor: Colors.success,
    marginTop: 20,
  },
  hint: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  storeButton: {
    backgroundColor: Colors.primary,
    marginTop: 10,
  },
  touchArea: {
    flex: 1,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    margin: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  touchAreaText: {
    fontSize: 18,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    padding: 10,
  },
});