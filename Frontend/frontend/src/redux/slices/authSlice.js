import { createSlice } from '@reduxjs/toolkit'

const getUserFromStorage = () => {
  const user = localStorage.getItem('user')
  if (!user || user === 'undefined') return null
  try {
    return JSON.parse(user)
  } catch (e) {
    console.error('Failed to parse user from storage', e)
    return null
  }
}

const initialState = {
  user: getUserFromStorage(),
  token: localStorage.getItem('access_token') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.access
      localStorage.setItem('user', JSON.stringify(action.payload.user))
      localStorage.setItem('access_token', action.payload.access)
      localStorage.setItem('refresh_token', action.payload.refresh)
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('user', JSON.stringify(state.user))
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions
export default authSlice.reducer
