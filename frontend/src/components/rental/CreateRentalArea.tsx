import React, { useEffect, useState } from "react";
import { Steps, Button, Flex, message, ConfigProvider, Spin } from "antd";
import {
  RentalFormProvider,
  useRentalForm,
} from "../../context/RentalFormContext";
import Step1BasicInfo from "./Step1BasicInfo";

import { useAuth } from "../../context/AuthContext";

import rentalService from "../../service/rental/rentalService";
import courtService from "../../service/courtService";
import courtPriceService from "../../service/courtPriceService";
import CheckCircleOutlined from "@ant-design/icons/lib/icons/CheckCircleOutlined";
import { useNavigate } from "react-router-dom";
import serviceItemService from "../../service/serviceItemService";
import legalProfileService from "../../service/legalProfileService";
import Step2BankAccount from "./Step2BankAccount";
import bankAccountService from "../../service/bankAccountService";
import Step3CourtInfo from "./Step3CourtInfo";
import Step4CourtCopy from "./Step4CourtCopy";
import Step5Services from "./Step5Services";
import Step6Legal from "./Step6Legal";

const FormContainer: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const { formData } = useRentalForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [currentStep]);
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
      const rentalAreaId =
        rentalResponse.result?.rentalAreaId || rentalResponse.rentalAreaId;

      if (!rentalAreaId) {
        message.error(
          "Không tạo được dữ liệu tòa nhà có lỗi xảy ra , thử lại sau",
        );
        setLoading(false);
        return;
      }
      if (completeData.bankAccount) {
        const bankData = completeData.bankAccount;

        const qrFile = bankData.qrCodeFile?.[0]?.originFileObj;

        const requestJson = {
          bankName: bankData.bankName,
          accountNumber: bankData.accountNumber,
          accountHolderName: bankData.accountHolderName,
          branchName: bankData.branchName || "",
           bankBin: bankData.bankBin,
          qrCode: bankData.qrCodeFile?.[0]?.url || "",
        };

        await bankAccountService.createBankAccount(requestJson, qrFile);
      }
      for (const courtType of completeData.courts) {
        const courtCopyRequests = (courtType.courtCopies || []).map(
          (copy: any) => ({
            courtCode: copy.courtCode,
            location: copy.location || "",
          }),
        );

        const courtPayload = {
          rentalAreaId: rentalAreaId,
          courtName: courtType.courtName,
          categoryId: courtType.categoryId,
          amenityIds: courtType.amenityIds || [],
          courtCopyRequests: courtCopyRequests,
        };

        const courtResponse = await courtService.createCourt(
          courtPayload,
          courtType.courtImages,
        );
        const courtId = courtResponse.result?.courtId || courtResponse.courtId;

        if (courtType.prices && courtType.prices.length > 0) {
          await Promise.all(
            courtType.prices.map((priceConfig: any) =>
              courtPriceService.createCourtPrice({
                courtId: courtId,
                pricePerHour: priceConfig.pricePerHour,
                priceType: priceConfig.priceType || "DEFAULT",
                startTime: priceConfig.startTime,
                endTime: priceConfig.endTime,
                priority: 1,
              }),
            ),
          );
        }
      }

      if (
        !completeData.extraServices?.setupLater &&
        completeData.extraServices?.services?.length > 0
      ) {
        await Promise.all(
          completeData.extraServices.services.map((service: any) =>
            serviceItemService.createServiceItem({
              rentalAreaId: rentalAreaId,
              itemGroupId: service.itemGroupId,
              serviceName: service.serviceName,
              quantity: service.quantity || 0,
              rentalDuration: service.rentalDuration || "",
              priceSell: service.price_sell || 0,
              priceOriginal: service.price_original || 0,
              serviceNote: service.serviceNote || "",
              images: service.images || [],
            }),
          ),
        );
      }
      if (completeData.legalInfo) {
        await legalProfileService.createLegalProfile({
          rentalAreaId: rentalAreaId,
          businessLicenseNumber: completeData.legalInfo.businessLicense || "",
          taxId: completeData.legalInfo.taxCode || "",
          companyName: completeData.legalInfo.companyName || "",
          responsiblePersonName:
            completeData.legalInfo.responsiblePersonName || "",
          address: completeData.legalInfo.address || "",
          legalNote: completeData.legalInfo.legalNote || "",
          imageFiles: completeData.legalInfo.legalImages || [],
        });
      }

      setSuccess(true);
      message.success(
        "Tạo cơ sở thành công! Giờ đây hãy tới trang quản lí cơ sở !",
      );
    } catch (error: any) {
      console.error("Lỗi luồng tạo dữ liệu:", error);
      message.error(
        error?.response?.data?.message ||
          "Lỗi khởi tạo: " + error?.message ||
          "Có lỗi xảy ra trong quá trình tạo. Vui lòng kiểm tra lại.",
      );
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: 100 }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>Đang tạo cơ sở, vui lòng đợi...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "80px auto",
          textAlign: "center",
          background: "#fff",
          padding: 40,
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a" }} />

        <h2 style={{ marginTop: 20 }}>Tạo cơ sở thành công </h2>

        <p style={{ color: "#666", marginTop: 12, lineHeight: 1.6 }}>
          Cơ sở của bạn đã được tạo và đang chờ xác thực.
          <br />
          Vui lòng kiểm tra trong <b>Quản lý cá nhân</b> để theo dõi trạng thái.
          <br />
          Đội ngũ của chúng tôi sẽ xác thực trong vòng <b>1–2 ngày làm việc</b>.
          <br />
          Sau khi hoàn tất, sân sẽ được duyệt và bắt đầu cho đặt lịch.
        </p>

        <Flex justify="center" gap={12} style={{ marginTop: 24 }}>
          <Button
            onClick={async () => {
              await refreshProfile();
              navigate("/");
            }}
          >
            Về trang chủ
          </Button>

          <Button
            type="primary"
            onClick={async () => {
              await refreshProfile();
              navigate("/owner");
            }}
            style={{ background: "#9156F1", borderColor: "#9156F1" }}
          >
            Đi tới quản lý
          </Button>
        </Flex>
      </div>
    );
  }
  const steps = [
    { title: "Thông tin cơ bản", content: <Step1BasicInfo next={next} /> },
    {
      title: "Tài khoản ngân hàng",
      content: <Step2BankAccount next={next} prev={prev} />,
    },
    {
      title: "Loại sân & Tiện ích",
      content: <Step3CourtInfo next={next} prev={prev} />,
    },
    {
      title: "Thông tin sân",
      content: <Step4CourtCopy next={next} prev={prev} />,
    },
    {
      title: "Dịch vụ khác",
      content: <Step5Services next={next} prev={prev} />,
    },
    {
      title: "Pháp lý & Hoàn tất",
      content: (
        <Step6Legal prev={prev} submit={handleSubmit} loading={loading} />
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
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#722ed1",
          borderRadius: 6,
        },
      }}
    >
      <RentalFormProvider>
        <FormContainer />
      </RentalFormProvider>
    </ConfigProvider>
  );
}
