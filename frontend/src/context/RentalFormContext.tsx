// RentalFormContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// Định nghĩa kiểu dữ liệu tổng quát cho toàn bộ form
interface FormData {
  basicInfo: any;
  courts: any[];
  courtCopies: any[];
  extraServices: any;
  legalInfo: any;
}

interface RentalFormContextType {
  formData: FormData;
  updateFormData: (stepKey: keyof FormData, data: any) => void;
}

const defaultData: FormData = {
  basicInfo: { country: 'Vietnam' }, // Mặc định quốc gia
  courts: [],
  courtCopies: [],
  extraServices: { setupLater: false, services: [] },
  legalInfo: {},
};

const RentalFormContext = createContext<RentalFormContextType | undefined>(undefined);

export const RentalFormProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [formData, setFormData] = useState<FormData>(defaultData);

  const updateFormData = (stepKey: keyof FormData, data: any) => {
    setFormData((prev) => ({ ...prev, [stepKey]: data }));
  };

  return (
    <RentalFormContext.Provider value={{ formData, updateFormData }}>
      {children}
    </RentalFormContext.Provider>
  );
};

export const useRentalForm = () => {
  const context = useContext(RentalFormContext);
  if (!context) throw new Error('useRentalForm must be used within RentalFormProvider');
  return context;
};