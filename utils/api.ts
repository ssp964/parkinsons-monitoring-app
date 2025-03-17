import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NAMING_QUESTIONS } from '@/constants/TestQuestions';
import * as FileSystem from 'expo-file-system';

interface HealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

export const API_URL = 'http://10.0.0.118:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Test connection function with typed response
export const testDatabaseConnection = async () => {
  try {
    const response = await api.get<HealthResponse>('/health');
    console.log('API connection test:', response.data);
    return response.data.database === 'connected' && response.data.status === 'healthy';
  } catch (error) {
    console.error('API connection error:', error);
    return false;
  }
};

export interface SignupData {
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

interface SignupResponse {
  success: boolean;
  patient_id: string;
  email: string;
  access_token: string;
}

// Update LoginResponse interface to match backend
interface LoginResponse {
  success: boolean;
  patient_id: string;
  email: string;
  access_token: string;
}

// Add new interface for profile data
interface PatientProfile {
  first_name: string;
  last_name: string;
  email: string;
  age: number;
  gender: string;
  phone: string;
  patient_id: string;
}

// Add interfaces for naming questions
interface NamingQuestion {
  question_id: string;
  answer: string;
  image_url: string;
  created_at: string;
}

// Add new interface for test record
interface TestRecord {
  patient_id: string;
  test_id: string;
  subtest_name: string;
  expected_responses: string[];
  actual_responses: string[];
  timestamp: string;
}

// Add interface for image upload response
interface ImageUploadResponse {
  image_id: number;
  success: boolean;
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

const isCacheExpired = async (key: string) => {
  try {
    const timestamp = await AsyncStorage.getItem(`${key}_timestamp`);
    if (!timestamp) return true;
    
    const stored = parseInt(timestamp, 10);
    return Date.now() - stored > CACHE_EXPIRY;
  } catch {
    return true;
  }
};

export const authApi = {
  signup: async (data: SignupData) => {
    try {
      const response = await api.post<SignupResponse>('/signup/', data);
      console.log('Signup response:', response.data);
      
      if (response.data.success && response.data.access_token) {
        await AsyncStorage.setItem('userToken', response.data.access_token);
        return {
          success: true,
          data: response.data,
          access_token: response.data.access_token,
          patient_id: response.data.patient_id
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Signup error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create account'
      };
    }
  },

  login: async (data: LoginData) => {
    try {
      const response = await api.post<LoginResponse>('/login/', data);
      console.log('Login response:', response.data);

      if (response.data.success && response.data.access_token) {
        await AsyncStorage.setItem('userToken', response.data.access_token);
        return {
          success: true,
          data: response.data,
          access_token: response.data.access_token,
          patient_id: response.data.patient_id
        };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.detail || 'Invalid email or password'
      };
    }
  },

  // Helper function to get the auth token
  getToken: async () => {
    return await AsyncStorage.getItem('userToken');
  },

  // Helper function to logout
  logout: async () => {
    return await AsyncStorage.removeItem('userToken');
  },

  // Add profile fetching method
  getProfile: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await api.get<PatientProfile>('/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Profile fetch error:', error.response?.data || error);
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to fetch profile'
      };
    }
  }
};




// Function to convert image URI to blob
const convertImageToBlob = async (imageUri: string): Promise<Blob> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error converting image to blob:', error);
    throw error;
  }
};

// Add separate function to handle image upload
const uploadImage = async (imageUri: string, imageId: string): Promise<number> => {
  try {
    const imageBlob = await convertImageToBlob(imageUri);
    const formData = new FormData();
    formData.append('image', imageBlob, `${imageId}.jpg`);

    const response = await fetch(`${API_URL}/images`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Image upload failed with status: ${response.status}`);
    }

    const result: ImageUploadResponse = await response.json();
    return result.image_id;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
};

// Function to submit test records to database
export const submitTestRecord = async (
  patientId: string, 
  testId: string,
  subtestName: string,
  data: any
): Promise<boolean> => {
  try {
    let payload: any = {
      patient_id: patientId,
      test_id: testId,
      subtest_name: subtestName,
      expected_responses: data.expected_responses || null,
      actual_responses: data.actual_responses || [],
      timestamp: new Date().toISOString()
    };

    const response = await fetch(`${API_URL}/test-records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log(`Test record submitted successfully for ${subtestName}`);
    return true;
  } catch (error) {
    console.error('Failed to submit test record:', error);
    return false;
  }
};

// Helper function to submit all test data
export const submitAllTestData = async (testResult: MoCATestResult): Promise<boolean> => {
  try {
    const subtests = [
      { name: '@memory_data', data: testResult.memory },
      { name: '@delayed_recall_data', data: testResult.delayed_response },
      { name: '@attention_fs_data', data: testResult.attention_fs },
      { name: '@attention_bs_data', data: testResult.attention_bs },
      { name: '@sentence_repetition_data', data: testResult.senetence_reptition },
      { name: '@visuospatial_clock_data', data: testResult.visuospatial_clock },
      // Add other subtests as needed
    ];

    for (const subtest of subtests) {
      const success = await submitTestRecord(
        testResult.patientId,
        testResult.testId,
        subtest.name,
        subtest.data
      );

      if (!success) {
        console.error(`Failed to submit ${subtest.name}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error submitting all test data:', error);
    return false;
  }
};