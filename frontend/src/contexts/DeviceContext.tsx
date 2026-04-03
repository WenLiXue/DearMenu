import { createContext, useContext, ReactNode } from 'react';
import { useDevice, DeviceInfo } from '../hooks/useDevice';

const DeviceContext = createContext<DeviceInfo | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const deviceInfo = useDevice();
  return (
    <DeviceContext.Provider value={deviceInfo}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDeviceContext() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDeviceContext must be used within DeviceProvider');
  }
  return context;
}
