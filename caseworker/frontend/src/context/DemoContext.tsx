import { createContext, useContext } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  getDemoHeaders: () => Record<string, string>;
}

const DemoContext = createContext<DemoContextType | null>(null);

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  // Get demo headers for API calls (simplified - no session needed)
  const getDemoHeaders = () => {
    return {
      'X-Demo-Mode': 'true',
    };
  };

  return (
    <DemoContext.Provider value={{
      isDemoMode: true,
      getDemoHeaders,
    }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemoContext must be used within DemoProvider');
  }
  return context;
};
