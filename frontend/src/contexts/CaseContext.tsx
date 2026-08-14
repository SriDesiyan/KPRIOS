import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { caseService } from '../services/caseService';
import { Case } from '../types/case';

interface CaseContextType {
  activeCase: Case | null;
  activeCaseId: string | null;
  cases: Case[];
  loading: boolean;
  setActiveCase: (caseItem: Case | null) => void;
  refreshCases: () => Promise<void>;
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCases = async () => {
    try {
      setLoading(true);
      const data = await caseService.listCases();
      setCases(data);
      if (data.length > 0) {
        setActiveCase((current) => {
          if (current) {
            const found = data.find((c) => c.id === current.id);
            return found || data[0];
          }
          return data[0];
        });
      }
    } catch (err) {
      console.error('Failed to load cases in CaseContext:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshCases();
  }, []);

  return (
    <CaseContext.Provider
      value={{
        activeCase,
        activeCaseId: activeCase ? activeCase.id : null,
        cases,
        loading,
        setActiveCase,
        refreshCases,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCase = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCase must be used within a CaseProvider');
  }
  return context;
};
