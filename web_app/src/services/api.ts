interface LoginResponse {
  success: boolean;
  doctor_id: string;
  email: string;
  access_token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const API_BASE_URL = 'http://localhost:8000';

interface HealthCheckResponse {
  status: string;
  database: string;
  timestamp: string;
}

export const doctorApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Added for CORS
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }
};

export const apiService = {
  checkHealth: async (): Promise<HealthCheckResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',  // Added for CORS
      });

      if (!response.ok) {
        throw new Error('API health check failed');
      }

      return response.json();
    } catch (error) {
      throw new Error(`API Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

interface Patient {
  patient_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export const patientApi = {
  getPatientById: async (patientId: string): Promise<Patient> => {
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patient data');
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  }
};