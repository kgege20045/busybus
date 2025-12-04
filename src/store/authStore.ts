export type AuthState = {
  isLoggedIn: boolean;
  email?: string;
  name?: string;
};

type AuthListener = (state: AuthState) => void;

let authState: AuthState = {
  isLoggedIn: false,
};

const listeners = new Set<AuthListener>();

const notify = () => {
  listeners.forEach((listener) => listener(authState));
};

export const getAuthState = (): AuthState => authState;

export const subscribeAuth = (listener: AuthListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const login = (email: string, name: string): void => {
  authState = {
    isLoggedIn: true,
    email,
    name,
  };
  notify();
};

export const logout = (): void => {
  authState = {
    isLoggedIn: false,
  };
  notify();
};

