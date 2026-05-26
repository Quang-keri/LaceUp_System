import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from "react";

interface FormData {
  basicInfo: any;
  bankAccount: any;
  courts: any[];
  courtCopies: any[];
  extraServices: any;
  legalInfo: any;
}

const defaultData: FormData = {
  basicInfo: { country: "Vietnam" },
  bankAccount: {},
  courts: [],
  courtCopies: [],
  extraServices: { setupLater: false, services: [] },
  legalInfo: {},
};
interface RentalFormContextType {
  formData: FormData;
  updateFormData: (stepKey: keyof FormData, data: any) => void;
}

const RentalFormContext = createContext<RentalFormContextType | undefined>(
  undefined,
);

export const RentalFormProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
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
  if (!context)
    throw new Error("useRentalForm must be used within RentalFormProvider");
  return context;
};
