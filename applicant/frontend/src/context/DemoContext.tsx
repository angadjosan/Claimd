import { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface DemoContextType {
  demoSessionId: string | null;
  isDemoMode: boolean;
  generateSessionId: () => string;
  getDemoHeaders: () => Record<string, string>;
  pollAssignmentStatus: (applicationId: string) => Promise<boolean>;
}

const DemoContext = createContext<DemoContextType | null>(null);

const SESSION_STORAGE_KEY = 'demoSessionId';
const SESSION_EXPIRY_KEY = 'demoSessionExpiresAt';
const SESSION_EXPIRY_HOURS = 24;

// Simple UUID v4 generator (fallback if crypto.randomUUID not available)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DemoProvider = ({ children }: { children: React.ReactNode }) => {
  const [demoSessionId, setDemoSessionId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Generate new sessionId (UUID v4)
  const generateSessionId = useCallback(() => {
    const sessionId = generateUUID();
    const expiresAt = Date.now() + (SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
    
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, expiresAt.toString());
    localStorage.setItem('demoMode', 'true');
    setDemoSessionId(sessionId);
    
    return sessionId;
  }, []);

  // Load sessionId from localStorage on mount
  useEffect(() => {
    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    const storedExpiresAt = localStorage.getItem(SESSION_EXPIRY_KEY);
    
    if (storedSessionId && storedExpiresAt) {
      const expiresAt = parseInt(storedExpiresAt, 10);
      if (Date.now() < expiresAt) {
        // Session still valid
        setDemoSessionId(storedSessionId);
        setIsDemoMode(localStorage.getItem('demoMode') === 'true');
      } else {
        // Session expired, generate new one
        generateSessionId();
      }
    } else {
      // No session, generate new one
      generateSessionId();
    }
  }, [generateSessionId]);

  // Get demo headers for API calls
  const getDemoHeaders = useCallback(() => {
    if (!demoSessionId) {
      throw new Error('Demo session ID not available');
    }
    
    return {
      'X-Demo-Mode': 'true',
      'X-Demo-Session-Id': demoSessionId,
    };
  }, [demoSessionId]);

  // Poll for assignment completion
  const pollAssignmentStatus = useCallback(async (
    applicationId: string,
    maxDuration: number = 30000, // 30 seconds
    interval: number = 500 // 500ms
  ): Promise<boolean> => {
    const startTime = Date.now();
    const demoCaseworkerId = import.meta.env.VITE_DEMO_CASEWORKER_USER_ID; // For frontend check only
    
    while (Date.now() - startTime < maxDuration) {
      try {
        const headers = getDemoHeaders();
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/demo/applications/${applicationId}/status`, {
          headers,
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if assigned to demo caseworker
          if (data.data?.isAssigned || data.data?.assignedTo === demoCaseworkerId) {
            return true;
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    // Timeout
    return false;
  }, [getDemoHeaders]);

  return (
    <DemoContext.Provider value={{
      demoSessionId,
      isDemoMode,
      generateSessionId,
      getDemoHeaders,
      pollAssignmentStatus,
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
