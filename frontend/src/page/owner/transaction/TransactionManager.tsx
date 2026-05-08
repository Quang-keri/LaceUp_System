import React, { useState, useEffect } from "react";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
} from "../../../service/transactionService";
import type {
  TransactionResponse,
  TransactionRequest,
  TransactionType,
  PageResponse,
} from "../../../types/transaction";

const TransactionManager: React.FC = () => {
  const [data, setData] = useState<PageResponse<TransactionResponse> | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [keyword, setKeyword] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TransactionRequest>({
    type: "INCOME",
    amount: 0,
    description: "",
  });

  const fetchTransactions = async () => {
    try {
      const res = await getTransactions({
        page,
        size: 10,
        type: filterType || undefined,
        keyword,
      });
      setData(res);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, filterType]);

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTransaction(editingId, formData);
      } else {
        await createTransaction(formData);
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Lỗi lưu giao dịch", error);
    }
  };

  const handleEdit = (tx: TransactionResponse) => {
    setFormData({
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
    });
    setEditingId(tx.id);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ type: "EXPENSE", amount: 0, description: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Quản Lý Sổ Quỹ (Thu/Chi)</h1>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Tìm theo mô tả..."
          className="border p-2 rounded"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className="border p-2 rounded"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
        >
          <option value="">Tất cả</option>
          <option value="INCOME">Khoản Thu</option>
          <option value="EXPENSE">Khoản Chi</option>
        </select>
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Tìm kiếm
        </button>
        <button
          onClick={openCreateModal}
          className="bg-green-500 text-white px-4 py-2 rounded ml-auto"
        >
          + Thêm Giao Dịch
        </button>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 border-b">
            <th className="p-3 text-left">Ngày</th>
            <th className="p-3 text-left">Loại</th>
            <th className="p-3 text-left">Mô tả</th>
            <th className="p-3 text-right">Số tiền (VNĐ)</th>
            <th className="p-3 text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data?.data.map((tx) => (
            <tr key={tx.id} className="border-b">
              <td className="p-3">
                {new Date(tx.transactionDate).toLocaleString("vi-VN")}
              </td>
              <td className="p-3">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    tx.type === "INCOME"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {tx.type === "INCOME" ? "THU" : "CHI"}
                </span>
              </td>
              <td className="p-3">{tx.description}</td>
              <td className="p-3 text-right font-semibold">
                {tx.amount.toLocaleString()}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => handleEdit(tx)}
                  className="text-blue-500 mr-3"
                >
                  Sửa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between items-center mt-4">
        <span>Tổng: {data?.totalElements || 0} bản ghi</span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border px-3 py-1 disabled:opacity-50"
          >
            Trước
          </button>
          <span>
            Trang {data?.currentPage} / {data?.totalPages}
          </span>
          <button
            disabled={page === data?.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border px-3 py-1 disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Sửa giao dịch" : "Thêm giao dịch"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Loại</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as TransactionType,
                    })
                  }
                >
                  <option value="INCOME">Thu</option>
                  <option value="EXPENSE">Chi</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Số tiền</label>
                <input
                  type="number"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: Number(e.target.value) })
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Mô tả (lý do)</label>
                <textarea
                  required
                  className="w-full border p-2 rounded"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
