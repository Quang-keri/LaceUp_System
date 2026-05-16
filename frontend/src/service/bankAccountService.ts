import api from '../config/axios';
const bankAccountService = {
  createBankAccount: async (data: any) => {
    const res = await api.post("/bank-accounts", data);
    return res.data;
  },
};

export default bankAccountService;