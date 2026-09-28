import { useAuthStore } from '@/stores/authStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store');

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set user', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      phone: '1234567890',
      firstName: 'John',
      lastName: 'Doe',
      panNumber: 'ABCDE1234F',
      occupationType: 'SALARIED' as const,
      financialYear: '2024-25',
      residentialAddress: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        country: 'India',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();

    expect(state.user).toEqual(mockUser);
  });

  it('should set token and persist to secure store', async () => {
    const mockToken = 'test-token-123';
    useAuthStore.getState().setToken(mockToken);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'authToken',
      mockToken
    );
  });

  it('should logout and clear auth state', async () => {
    useAuthStore.setState({
      user: { id: '1', email: 'test@example.com' } as any,
      token: 'token-123',
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('should update user', () => {
    useAuthStore.setState({
      user: {
        id: '1',
        firstName: 'John',
      } as any,
    });

    useAuthStore.getState().updateUser({ firstName: 'Jane' });

    const state = useAuthStore.getState();
    expect(state.user?.firstName).toBe('Jane');
  });

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('should set error message', () => {
    const errorMsg = 'Authentication failed';
    useAuthStore.getState().setError(errorMsg);

    expect(useAuthStore.getState().error).toBe(errorMsg);
  });
});
