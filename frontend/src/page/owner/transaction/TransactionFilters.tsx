import React from "react";
import type { TransactionType } from "../../../types/transaction";

type Props = {
  filterType: TransactionType | "";
  keyword: string;
  startDate: string;
  endDate: string;
  setFilterType: (value: TransactionType | "") => void;
  setKeyword: (value: string) => void;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
};

const TransactionFilters: React.FC<Props> = ({
  filterType,
  keyword,
  startDate,
  endDate,
  setFilterType,
  setKeyword,
  setStartDate,
  setEndDate,
  onSearch,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại
          </label>
          <select
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterType}
            onChange={(e) =>
              setFilterType((e.target.value || "") as TransactionType | "")
            }
          >
            <option value="">Tất cả</option>
            <option value="INCOME">Khoản Thu</option>
            <option value="EXPENSE">Khoản Chi</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ ngày
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Đến ngày
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tìm kiếm
          </label>
          <input
            type="text"
            placeholder="Mô tả giao dịch..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
        </div>

        <div className="flex gap-2 pt-7">
          <button
            onClick={onSearch}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Tìm
          </button>

          <button
            onClick={onReset}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;
