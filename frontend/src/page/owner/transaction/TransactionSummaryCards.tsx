import React from "react";

type Props = {
  totalIncome?: number;
  totalExpense?: number;
  totalPayout?: number;
};

const TransactionSummaryCards: React.FC<Props> = ({
  totalIncome = 0,
  totalExpense = 0,
  totalPayout = 0,
}) => {
  const profit = totalIncome - totalExpense;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">Tổng Thu</p>

        <p className="text-2xl font-bold text-green-600">
          {totalIncome.toLocaleString("vi-VN")} ₫
        </p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">Tổng Chi</p>

        <p className="text-2xl font-bold text-red-600">
          {totalExpense.toLocaleString("vi-VN")} ₫
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">Tiền Đã Nhận Từ Hệ Thống</p>

        <p className="text-2xl font-bold text-blue-600">
          {totalPayout.toLocaleString("vi-VN")} ₫
        </p>
      </div>

      <div
        className={`border rounded-lg p-4 ${
          profit >= 0
            ? "bg-purple-50 border-purple-200"
            : "bg-orange-50 border-orange-200"
        }`}
      >
        <p className="text-gray-600 text-sm">Lợi nhuận</p>

        <p
          className={`text-2xl font-bold ${
            profit >= 0 ? "text-purple-600" : "text-orange-600"
          }`}
        >
          {profit.toLocaleString("vi-VN")} ₫
        </p>
      </div>
    </div>
  );
};

export default TransactionSummaryCards;
