import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  BabyProfile,
  BabyProfileCreate,
  BabyProfileUpdate,
  FeedingSession,
  FeedingSessionCreate,
  FeedingSessionUpdate,
  SleepSession,
  SleepSessionCreate,
  SleepSessionUpdate,
  DiaperEvent,
  DiaperEventCreate,
  DiaperEventUpdate,
  GrowthMeasurement,
  GrowthMeasurementCreate,
  GrowthMeasurementUpdate,
} from '../types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for adding auth tokens (if needed later)
apiClient.interceptors.request.use(
  (config) => {
    // You can add authentication token here later
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Error in request setup
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============= Baby Profile API =============
export const babyApi = {
  // Get all babies
  getAll: async (): Promise<BabyProfile[]> => {
    const response = await apiClient.get<BabyProfile[]>('/api/v1/babies/');
    return response.data;
  },

  // Get baby by ID
  getById: async (id: string): Promise<BabyProfile> => {
    const response = await apiClient.get<BabyProfile>(`/api/v1/babies/${id}`);
    return response.data;
  },

  // Create new baby profile
  create: async (data: BabyProfileCreate): Promise<BabyProfile> => {
    const response = await apiClient.post<BabyProfile>('/api/v1/babies/', data);
    return response.data;
  },

  // Update baby profile
  update: async (id: string, data: BabyProfileUpdate): Promise<BabyProfile> => {
    const response = await apiClient.put<BabyProfile>(`/api/v1/babies/${id}`, data);
    return response.data;
  },

  // Delete baby profile
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/babies/${id}`);
  },
};

// ============= Feeding Session API =============
export const feedingApi = {
  // Get all feeding sessions
  getAll: async (params?: { baby_id?: string; skip?: number; limit?: number }): Promise<FeedingSession[]> => {
    const response = await apiClient.get<FeedingSession[]>('/api/v1/feeding/', { params });
    return response.data;
  },

  // Get feeding session by ID
  getById: async (id: string): Promise<FeedingSession> => {
    const response = await apiClient.get<FeedingSession>(`/api/v1/feeding/${id}`);
    return response.data;
  },

  // Create new feeding session
  create: async (data: FeedingSessionCreate): Promise<FeedingSession> => {
    const response = await apiClient.post<FeedingSession>('/api/v1/feeding/', data);
    return response.data;
  },

  // Update feeding session
  update: async (id: string, data: FeedingSessionUpdate): Promise<FeedingSession> => {
    const response = await apiClient.put<FeedingSession>(`/api/v1/feeding/${id}`, data);
    return response.data;
  },

  // Delete feeding session
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/feeding/${id}`);
  },
};

// ============= Sleep Session API =============
export const sleepApi = {
  // Get all sleep sessions
  getAll: async (params?: { baby_id?: string; skip?: number; limit?: number }): Promise<SleepSession[]> => {
    const response = await apiClient.get<SleepSession[]>('/api/v1/sleep/', { params });
    return response.data;
  },

  // Get sleep session by ID
  getById: async (id: string): Promise<SleepSession> => {
    const response = await apiClient.get<SleepSession>(`/api/v1/sleep/${id}`);
    return response.data;
  },

  // Create new sleep session
  create: async (data: SleepSessionCreate): Promise<SleepSession> => {
    const response = await apiClient.post<SleepSession>('/api/v1/sleep/', data);
    return response.data;
  },

  // Update sleep session
  update: async (id: string, data: SleepSessionUpdate): Promise<SleepSession> => {
    const response = await apiClient.put<SleepSession>(`/api/v1/sleep/${id}`, data);
    return response.data;
  },

  // Delete sleep session
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/sleep/${id}`);
  },
};

// ============= Diaper Event API =============
export const diaperApi = {
  // Get all diaper events
  getAll: async (params?: { baby_id?: string; skip?: number; limit?: number }): Promise<DiaperEvent[]> => {
    const response = await apiClient.get<DiaperEvent[]>('/api/v1/diaper/', { params });
    return response.data;
  },

  // Get diaper event by ID
  getById: async (id: string): Promise<DiaperEvent> => {
    const response = await apiClient.get<DiaperEvent>(`/api/v1/diaper/${id}`);
    return response.data;
  },

  // Create new diaper event
  create: async (data: DiaperEventCreate): Promise<DiaperEvent> => {
    const response = await apiClient.post<DiaperEvent>('/api/v1/diaper/', data);
    return response.data;
  },

  // Update diaper event
  update: async (id: string, data: DiaperEventUpdate): Promise<DiaperEvent> => {
    const response = await apiClient.put<DiaperEvent>(`/api/v1/diaper/${id}`, data);
    return response.data;
  },

  // Delete diaper event
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/diaper/${id}`);
  },
};

// ============= Growth Measurement API =============
export const growthApi = {
  // Get all growth measurements
  getAll: async (params?: { baby_id?: string; skip?: number; limit?: number }): Promise<GrowthMeasurement[]> => {
    const response = await apiClient.get<GrowthMeasurement[]>('/api/v1/growth/', { params });
    return response.data;
  },

  // Get growth measurement by ID
  getById: async (id: string): Promise<GrowthMeasurement> => {
    const response = await apiClient.get<GrowthMeasurement>(`/api/v1/growth/${id}`);
    return response.data;
  },

  // Create new growth measurement
  create: async (data: GrowthMeasurementCreate): Promise<GrowthMeasurement> => {
    const response = await apiClient.post<GrowthMeasurement>('/api/v1/growth/', data);
    return response.data;
  },

  // Update growth measurement
  update: async (id: string, data: GrowthMeasurementUpdate): Promise<GrowthMeasurement> => {
    const response = await apiClient.put<GrowthMeasurement>(`/api/v1/growth/${id}`, data);
    return response.data;
  },

  // Delete growth measurement
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/growth/${id}`);
  },
};

// Export default API client for custom requests
export default apiClient;
