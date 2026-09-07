import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface Workspace {
  id: string;
  name: string;
  wabaId?: string;
  role?: string;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
}

const getStoredWorkspace = (): Workspace | null => {
  const ws = localStorage.getItem('notifyiq_workspace');
  if (ws) {
    try {
      return JSON.parse(ws);
    } catch {
      return null;
    }
  }
  return null;
};

const initialState: WorkspaceState = {
  workspaces: [],
  currentWorkspace: getStoredWorkspace(),
  isLoading: false,
  error: null,
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    fetchWorkspacesStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    fetchWorkspacesSuccess(state, action: PayloadAction<Workspace[]>) {
      state.isLoading = false;
      state.workspaces = action.payload;
      if (!state.currentWorkspace && action.payload.length > 0) {
        state.currentWorkspace = action.payload[0];
        localStorage.setItem('notifyiq_workspace', JSON.stringify(action.payload[0]));
      }
    },
    fetchWorkspacesFailure(state, action: PayloadAction<string>) {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCurrentWorkspace(state, action: PayloadAction<Workspace>) {
      state.currentWorkspace = action.payload;
      localStorage.setItem('notifyiq_workspace', JSON.stringify(action.payload));
    },
    clearWorkspaceState(state) {
      state.workspaces = [];
      state.currentWorkspace = null;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('notifyiq_workspace');
    }
  },
});

export const {
  fetchWorkspacesStart,
  fetchWorkspacesSuccess,
  fetchWorkspacesFailure,
  setCurrentWorkspace,
  clearWorkspaceState
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
