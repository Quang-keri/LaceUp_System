// CreateRentalArea.tsx
import React, { useState } from "react";
import { Steps, Button, Flex, message } from "antd";
import {
  RentalFormProvider,
  useRentalForm,
} from "../../context/RentalFormContext";

// Import các bước (Định nghĩa ở phần dưới)
import Step1BasicInfo from "./Step1BasicInfo";
import Step2CourtInfo from "./Step2CourtInfo";
import Step3CourtCopy from "./Step3CourtCopy";
import Step4Services from "./Step4Services";
import Step5Legal from "./Step5Legal";

const FormContainer: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { formData } = useRentalForm();

  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    console.log("Final Data submitted to API:", formData);
    // Call API tạo RentalArea -> tạo Court -> tạo CourtCopy -> ...
    message.success("Tạo khu vực cho thuê thành công!");
  };

  const steps = [
    { title: "Thông tin cơ bản", content: <Step1BasicInfo next={next} /> },
    {
      title: "Loại sân & Giá",
      content: <Step2CourtInfo next={next} prev={prev} />,
    },
    {
      title: "Thông tin sân",
      content: <Step3CourtCopy next={next} prev={prev} />,
    },
    {
      title: "Dịch vụ khác",
      content: <Step4Services next={next} prev={prev} />,
    },
    {
      title: "Pháp lý & Hoàn tất",
      content: <Step5Legal prev={prev} submit={handleSubmit} />,
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
      <Steps
        type="navigation"
        current={currentStep}
        items={steps.map((s) => ({ title: s.title }))}
      />
      <div
        style={{
          marginTop: 24,
          padding: 24,
          background: "#fafafa",
          borderRadius: 8,
        }}
      >
        {steps[currentStep].content}
      </div>
    </div>
  );
};

export default function CreateRentalAreaPage() {
  return (
    <RentalFormProvider>
      <FormContainer />
    </RentalFormProvider>
  );
}
