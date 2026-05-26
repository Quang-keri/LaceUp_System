import api from "../config/axios";

const bankAccountService = {
  createBankAccount: async (bankData: any, qrCodeFile?: File) => {
    const formData = new FormData();

    formData.append(
      "data",
      new Blob([JSON.stringify(bankData)], { type: "application/json" }),
    );

    if (qrCodeFile) {
      formData.append("qrCodeFile", qrCodeFile);
    }

    const res = await api.post("/bank-accounts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  getMyBankAccount: async () => {
    const res = await api.get("/bank-accounts");
    return res.data;
  },
};

export default bankAccountService;
