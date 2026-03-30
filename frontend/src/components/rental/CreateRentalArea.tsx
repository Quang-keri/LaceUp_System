// CreateRentalArea.tsx
import React, { useState } from "react";
import { Steps, Button, Flex, message } from "antd";
import {
  RentalFormProvider,
  useRentalForm,
} from "../../context/RentalFormContext";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2CourtInfo from "./Step2CourtInfo";
import Step3CourtCopy from "./Step3CourtCopy";
import Step4Services from "./Step4Services";
import Step5Legal from "./Step5Legal";
import { useAuth } from "../../context/AuthContext";

import rentalService from "../../service/rental/rentalService";
import courtService from "../../service/courtService";
import courtPriceService from "../../service/courtPriceService";

const FormContainer: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const { formData } = useRentalForm();
  const [loading, setLoading] = useState(false);

  const next = () => setCurrentStep(currentStep + 1);
  const prev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async (finalStepData?: any) => {
    setLoading(true);

    const completeData = {
      ...formData,
      legalInfo: finalStepData,
    };

    console.log("=== TỔNG HỢP DỮ LIỆU CUỐI CÙNG ===", completeData);

    try {
      const rentalPayload = {
        userId: user?.userId || "",
        rentalAreaName: completeData.basicInfo.rentalAreaName,
        contactName: completeData.basicInfo.contactName,
        contactPhone: completeData.basicInfo.contactPhone,
        street: completeData.basicInfo.address.street,
        ward: completeData.basicInfo.address.ward,
        district: completeData.basicInfo.address.district,
        cityName: completeData.basicInfo.address.cityName,
        latitude: completeData.basicInfo.address.latitude,
        longitude: completeData.basicInfo.address.longitude,
        facebookLink: completeData.basicInfo.facebookLink || "",
        gmail: completeData.basicInfo.gmail || "",
        openTime: completeData.basicInfo.openTime
          ? completeData.basicInfo.openTime.format("HH:mm:ss")
          : null,
        closeTime: completeData.basicInfo.closeTime
          ? completeData.basicInfo.closeTime.format("HH:mm:ss")
          : null,

        images: completeData.basicInfo.images,
      };

      const rentalResponse = await rentalService.createRentalArea(
        rentalPayload,
      );

      const rentalAreaId = rentalResponse.result.rentalAreaId;
      if (!rentalAreaId) {
        message.error("Không tạo được dữ liệu tòa nhà có lỗi xảy ra , thử lại sau");
        return;
      }
      for (const courtType of completeData.courts) {
        const courtCopyRequests = (courtType.courtCopies || []).map(
          (copy: any) => ({
            courtCode: copy.courtCode,
            location: copy.location || "",
          }),
        );

        const courtPayload = {
          courtName: courtType.courtName,
          categoryId: courtType.categoryId,
          amenityIds: courtType.amenityIds || [],
          courtCopyRequests: courtCopyRequests,
          images: courtType.courtImages,
        };

        const courtResponse = await courtService.createCourt(
          courtPayload,
          rentalAreaId,
        );
        const courtId = courtResponse.result.courtId;

        if (courtType.prices && courtType.prices.length > 0) {
          for (const priceConfig of courtType.prices) {
            await courtPriceService.createCourtPrice({
              courtId: courtId,
              pricePerHour: priceConfig.pricePerHour,
              priceType: priceConfig.priceType || "DEFAULT",
              startTime: priceConfig.startTime,
              endTime: priceConfig.endTime,
              priority: 1,
            });
          }
        }
      }

      message.success("Tất cả dữ liệu đã được khởi tạo thành công!");
    } catch (error: any) {
      console.error("Lỗi luồng tạo dữ liệu:", error);
      message.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra trong quá trình tạo. Vui lòng kiểm tra lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: "Thông tin cơ bản", content: <Step1BasicInfo next={next} /> },
    {
      title: "Loại sân & Tiện ích",
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
      content: (
        <Step5Legal prev={prev} submit={handleSubmit} loading={loading} />
      ),
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
