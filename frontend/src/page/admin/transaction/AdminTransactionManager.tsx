import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Select, Space, message } from "antd";

import {
  getTransactions,
  getRentalAreaTransactions,
  createTransaction,
  updateTransaction,
} from "../../../service/transactionService";

import rentalService from "../../../service/rental/rentalService";

import type {
  TransactionResponse,
  TransactionRequest,
  TransactionType,
  PageResponse,
} from "../../../types/transaction";
import TransactionSummaryCards from "../../owner/transaction/TransactionSummaryCards";
import TransactionFilters from "../../owner/transaction/TransactionFilters";
import TransactionTable from "../../owner/transaction/TransactionTable";
import TransactionFormModal from "../../owner/transaction/TransactionFormModal";
import TransactionDetailModal from "../../owner/transaction/TransactionDetailModal";


const AdminTransactionManager: React.FC = () => {
  const [data, setData] = useState<PageResponse<TransactionResponse> | null>(
    null,
  );

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(false);

  // Admin chọn sân
  const [selectedRentalAreaId, setSelectedRentalAreaId] = useState<
    string | undefined
  >(undefined);

  const [page, setPage] = useState(1);

  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionResponse | null>(null);

  const [formData, setFormData] = useState<TransactionRequest>({
    type: "INCOME",
    amount: 0,
    description: "",
  });

  // Load toàn bộ khu sân
  const fetchRentalAreas = async () => {
    try {
      setLoadingRentals(true);

      const res = await rentalService.getAllRentalAreas?.(1, 100);

      const rentals =
        res?.result?.data || res?.result?.content || res?.result || [];

      setRentalAreas(rentals);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải danh sách khu sân",
      );
    } finally {
      setLoadingRentals(false);
    }
  };

  const totalIncome = useMemo(() => {
    return (data?.data || []).reduce(
      (sum, tx) => sum + (tx.type === "INCOME" ? tx.amount : 0),
      0,
    );
  }, [data]);

  const totalExpense = useMemo(() => {
    return (data?.data || []).reduce(
      (sum, tx) => sum + (tx.type === "EXPENSE" ? tx.amount : 0),
      0,
    );
  }, [data]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params: Record<string, unknown> = {
        page,
        size: 10,
      };

      if (filterType) params.type = filterType;
      if (keyword) params.keyword = keyword;
      if (startDate) params.startDate = startDate + "T00:00:00";
      if (endDate) params.endDate = endDate + "T23:59:59";

      let res;

      // Nếu chọn khu sân -> lọc theo sân
      if (selectedRentalAreaId) {
        res = await getRentalAreaTransactions(selectedRentalAreaId, params);
      } else {
        // Không chọn -> xem toàn hệ thống
        res = await getTransactions(params);
      }

      setData(res);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);
      setError("Không thể tải dữ liệu giao dịch. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [selectedRentalAreaId, page, filterType, keyword, startDate, endDate]);

  useEffect(() => {
    fetchRentalAreas();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setKeyword("");
    setFilterType("");
    setStartDate("");
    setEndDate("");
    setSelectedRentalAreaId(undefined);
    setPage(1);
  };

  const openCreateModal = () => {
    setFormData({
      type: "INCOME",
      amount: 0,
      description: "",
    });

    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (tx: TransactionResponse) => {
    setFormData({
      type: tx.type,
      amount: tx.amount,
      description: tx.description || "",
    });

    setEditingId(tx.id);
    setIsFormModalOpen(true);
  };

  const handleView = (tx: TransactionResponse) => {
    setSelectedTransaction(tx);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (editingId) {
        await updateTransaction(editingId, formData);
      } else {
        await createTransaction(formData);
      }

      setIsFormModalOpen(false);
      setPage(1);

      await fetchTransactions();
    } catch (error) {
      console.error("Lỗi lưu giao dịch", error);
      setError("Không thể lưu giao dịch. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Giao Dịch
            </h1>

            <p className="text-gray-600 mt-1">
              Xem giao dịch toàn hệ thống hoặc theo từng khu sân
            </p>
          </div>

          <Space>
            <Select
              allowClear
              style={{ width: 320 }}
              placeholder="Tất cả khu sân"
              loading={loadingRentals}
              value={selectedRentalAreaId}
              onChange={(value) => {
                setSelectedRentalAreaId(value);
                setPage(1);
              }}
              options={rentalAreas.map((item) => ({
                value: item.rentalAreaId,
                label: item.rentalAreaName,
              }))}
            />

            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              + Thêm Giao Dịch
            </button>
          </Space>
        </Space>

        <TransactionSummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
        />

        <TransactionFilters
          filterType={filterType}
          keyword={keyword}
          startDate={startDate}
          endDate={endDate}
          setFilterType={setFilterType}
          setKeyword={setKeyword}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          onSearch={handleSearch}
          onReset={handleResetFilters}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <TransactionTable
          data={data}
          loading={loading}
          page={page}
          setPage={setPage}
          onEdit={handleEdit}
          onView={handleView}
        />

        <TransactionFormModal
          open={isFormModalOpen}
          editingId={editingId}
          formData={formData}
          setFormData={setFormData}
          isSubmitting={isSubmitting}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleSubmit}
        />

        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </div>
    </div>
  );
};

export default AdminTransactionManager;
