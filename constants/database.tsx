import { authApi } from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface NamingResponse {
  responses: string[];
  timestamp: string;
}

export interface TrailMakingResponse {
  expected_responses: string[];
  actual_responses: string[];
  score: number;
}

export interface MemoryTrialResponse {
  expected_responses: string[];
  actual_responses: string[];
}

export interface AttentionFSResponse {
    expected_responses: string[];
    actual_responses: string[];
}

export interface AttentionBSResponse {
    expected_responses: string[];
    actual_responses: string[];
}
export interface SentenceRepetition {
    expected_responses: string[];
    actual_responses: string[];
}
export interface DelayedResponse {
  expected_responses: string[];
  actual_responses: string[];
}

export interface OrientationResponse {
  expected_responses: string[];
  actual_responses: string[];
  score: number;
}

export interface VisuospatialClockResponse {
  image_id: string;
  image_uri: string;
  actual_responses: string[];
  timestamp: string;
}

export interface MoCATestResult {
  testId: string;
  patientId: string;
  dateCompleted: string;
  naming: NamingResponse;
  trailMaking: TrailMakingResponse;
  memory: MemoryTrialResponse;
  attention_fs: AttentionFSResponse;
  attention_bs: AttentionBSResponse;
  senetence_reptition: SentenceRepetition;
  delayed_response: DelayedResponse;
  orientation: OrientationResponse;
  visuospatial_clock: VisuospatialClockResponse;
  totalScore: number;
}

export const initialTestResult: MoCATestResult = {
  testId: '',
  patientId: '',
  dateCompleted: '',
  naming: {
    responses: [],
    timestamp: ''
  },
  trailMaking: {
    expected_responses: [],
    actual_responses: [],
    score: 0
  },
  memory: {
    expected_responses: [],
    actual_responses: [],
  },
  attention_fs: {
    expected_responses: [],
    actual_responses: [],
  },
  attention_bs: {
    expected_responses: [],
    actual_responses: [],
  },
  sentence_reptition: {
    expected_responses: [],
    actual_responses: [],
  },
  delayed_response: {
    expected_responses: [],
    actual_responses : [],
  },

  orientation: {
    expected_responses: [],
    actual_responses : [],
    score: 0
  },
  visuospatial_clock: {
    image_id: '',
    image_uri: '',
    timestamp: ''
  },
  totalScore: 0
};


export interface VisuoSpatial {
  image_id: "";
  image_uri: "";
  timestamp: "";
}

// Helper function to create a new timestamp
export const createTimestamp = () => new Date().toISOString();

// Helper function to generate random alphabets
const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Update createTestId to use random alphabets
export const createTestId = async (): Promise<string> => {
  try {
    // Generate 5 random alphabets
    const randomId = generateRandomString(5);
    
    // Generate date string in YYYYMMDD format
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}${month}${day}`;
    
    // Combine random ID with date
    const testId = `${randomId}_${dateString}`;
    console.log('Generated Test ID:', testId);
    return testId;
  } catch (error) {
    console.error('Error generating test ID:', error);
    return `XXXXX_${Date.now()}`;
  }
};

export const storeTestResult = async (result: MoCATestResult) => {
  try {
    const testId = await createTestId();
    const resultWithId = {
      ...result,
      testId,
      dateCompleted: new Date().toISOString()
    };

    // Store locally first
    const existingResults = await AsyncStorage.getItem('@moca_results');
    const results = existingResults ? JSON.parse(existingResults) : [];
    results.push(resultWithId);
    await AsyncStorage.setItem('@moca_results', JSON.stringify(results));

    // Try to submit test ID
    const submitted = await submitTestId(testId);
    if (!submitted) {
      console.warn('Test ID submission failed, but results stored locally');
    }

    return true;
  } catch (error) {
    console.error('Failed to store test result:', error);
    Alert.alert(
      'Error',
      'Failed to save test result. Please try again.'
    );
    return false;
  }
};

// Helper function to retrieve test results
export const getTestResults = async (): Promise<MoCATestResult[]> => {
  try {
    const results = await AsyncStorage.getItem('@moca_results');
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Failed to retrieve test results:', error);
    return [];
  }
};

interface TestIDRequest {
  test_id: string;
}

export const submitTestId = async (testId: string): Promise<boolean> => {
  try {
    const response = await fetch('http://10.0.0.206:5433/receive-test-id/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test_id: testId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Test ID submitted successfully:', testId);
    return true;
  } catch (error) {
    console.error('Failed to submit test ID:', error);
    return false;
  }
};

const viewAsyncStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const items = await AsyncStorage.multiGet(keys);
    console.log('\n--- Async Storage Contents ---');
    items.forEach(([key, value]) => {
      console.log(`\n${key}:`);
      try {
        // Try to parse and prettify JSON values
        const parsed = JSON.parse(value || '');
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        // If not JSON, show raw value
        console.log(value);
      }
    });
    console.log('\n--------------------------');
  } catch (error) {
    console.error('Error viewing AsyncStorage:', error);
  }
};