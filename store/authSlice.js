import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api, extractApiData } from '@/lib/api/client';

const initialState = {
  user: null,
  status: 'idle',
  bootstrapped: false,
  error: null,
};

export const fetchMe = createAsyncThunk('auth/fetchMe', async () => {
  const response = await api.get('/api/auth/me');
  return extractApiData(response)?.user ?? null;
});

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      return extractApiData(response)?.user ?? null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, username, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', {
        name,
        username,
        email,
        password,
      });

      return extractApiData(response)?.user ?? null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/api/auth/logout');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'succeeded';
        state.bootstrapped = true;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.user = null;
        state.status = 'failed';
        state.bootstrapped = true;
        state.error = action.error?.message || 'Unable to load session';
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      })
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Registration failed';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload || 'Unable to log out';
      });
  },
});

export const { clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
