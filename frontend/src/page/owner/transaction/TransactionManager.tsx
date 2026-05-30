import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Select, Space, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";

import {
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

import TransactionSummaryCards from "./TransactionSummaryCards";
import TransactionFilters from "./TransactionFilters";
import TransactionTable from "./TransactionTable";
import TransactionFormModal from "./TransactionFormModal";
import TransactionDetailModal from "./TransactionDetailModal";

const TransactionManager: React.FC = () => {
  const { rentalAreaId } = useParams<{ rentalAreaId?: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<PageResponse<TransactionResponse> | null>(
    null,
  );

  const [rentalAreas, setRentalAreas] = useState<any[]>([]);
  const [loadingRentals, setLoadingRentals] = useState(false);

  const selectedRentalAreaId = rentalAreaId;

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
    status: "SUCCESS",
    paymentMethod: "CASH",
    category: "EXTRA_SERVICE_PAYMENT",
    rentalAreaId,
  });

  // Load khu sân của owner
  const fetchMyRentalAreas = async () => {
    try {
      setLoadingRentals(true);

      const res = await rentalService.getMyRentalAreas(1, 100);

      const rentals =
        res.result?.data|| res.result || [];

      setRentalAreas(rentals);

      // Nếu chưa có rentalAreaId -> chuyển sang sân đầu tiên
      if (!rentalAreaId && rentals.length > 0) {
        navigate(`/owner/transactions/${rentals[0].rentalAreaId}`, {
          replace: true,
        });
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Lỗi tải danh sách khu sân",
      );
    } finally {
      setLoadingRentals(false);
    }
  };

  // Tổng thu
  const totalIncome = useMemo(() => {
    return (data?.data || []).reduce((sum, tx) => {
      return tx.type === "INCOME" ? sum + tx.amount : sum;
    }, 0);
  }, [data]);

  // Tổng chi
  const totalExpense = useMemo(() => {
    return (data?.data || []).reduce((sum, tx) => {
      return tx.type === "EXPENSE" ? sum + tx.amount : sum;
    }, 0);
  }, [data]);

  // Tổng tiền admin đã chuyển cho owner
  const totalPayout = useMemo(() => {
    return (data?.data || []).reduce((sum, tx) => {
      return tx.type === "PAYOUT" ? sum + tx.amount : sum;
    }, 0);
  }, [data]);

  // Fetch transaction
  const fetchTransactions = useCallback(async () => {
    if (!rentalAreaId) return;

    try {
      setLoading(true);
      setError("");

      const params: Record<string, unknown> = {
        page,
        size: 10,
      };

      if (filterType) params.type = filterType;
      if (keyword) params.keyword = keyword;

      if (startDate) {
        params.startDate = `${startDate}T00:00:00`;
      }

      if (endDate) {
        params.endDate = `${endDate}T23:59:59`;
      }

      const res = await getRentalAreaTransactions(rentalAreaId, params);

      setData(res);
    } catch (error) {
      console.error("Lỗi tải dữ liệu", error);

      setError("Không thể tải dữ liệu giao dịch. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [rentalAreaId, page, filterType, keyword, startDate, endDate]);

  useEffect(() => {
    fetchMyRentalAreas();
  }, []);

  useEffect(() => {
    if (rentalAreaId) {
      fetchTransactions();
    }
  }, [rentalAreaId, fetchTransactions]);

  // Đổi sân
  const handleChangeRentalArea = (id: string) => {
    setPage(1);
    navigate(`/owner/transactions/${id}`);
  };

  // Search
  const handleSearch = () => {
    setPage(1);
    fetchTransactions();
  };

  // Reset filter
  const handleResetFilters = () => {
    setKeyword("");
    setFilterType("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  // Mở modal tạo
  const openCreateModal = () => {
    setFormData({
      type: "INCOME",
      amount: 0,
      description: "",
      status: "SUCCESS",
      paymentMethod: "CASH",
      category: "EXTRA_SERVICE_PAYMENT",
      rentalAreaId,
    });

    setEditingId(null);
    setIsFormModalOpen(true);
  };

  // Edit
  const handleEdit = (tx: TransactionResponse) => {
    setFormData({
      type: tx.type,
      amount: tx.amount,
      description: tx.description || "",
      referenceId: tx.referenceId,
      status: tx.status,
      paymentMethod: tx.paymentMethod,
      category: tx.category,
      rentalAreaId: tx.rentalAreaId || rentalAreaId,
    });

    setEditingId(tx.id);
    setIsFormModalOpen(true);
  };

  // View detail
  const handleView = (tx: TransactionResponse) => {
    setSelectedTransaction(tx);
  };

  // Submit
  const handleSubmit = async (values: TransactionRequest) => {
    try {
      setIsSubmitting(true);

      if (editingId) {
        await updateTransaction(editingId, values);
      } else {
        await createTransaction(values);
      }

      setIsFormModalOpen(false);

      setPage(1);

      await fetchTransactions();

      message.success(
        editingId
          ? "Cập nhật giao dịch thành công"
          : "Tạo giao dịch thành công",
      );
    } catch (error: any) {
      console.error("Lỗi lưu giao dịch", error);

      setError(
        error.response?.data?.message ||
          "Không thể lưu giao dịch. Vui lòng thử lại.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div>
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
              Xem giao dịch phát sinh theo từng khu sân
            </p>
          </div>

          <Space>
            <Select
              style={{ width: 320 }}
              placeholder="Chọn khu sân"
              loading={loadingRentals}
              value={selectedRentalAreaId}
              onChange={handleChangeRentalArea}
              options={rentalAreas.map((item) => ({
                value: item.rentalAreaId,
                label: item.rentalAreaName,
              }))}
            />

            <Button type="primary" onClick={openCreateModal}>
              + Thêm Giao Dịch
            </Button>
          </Space>
        </Space>

        <TransactionSummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          totalPayout={totalPayout}
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
          isSubmitting={isSubmitting}
          onClose={() => setIsFormModalOpen(false)}
          onSubmit={handleSubmit}
          rentalAreaId={rentalAreaId}
          role="OWNER"
        />

        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      </div>
    </div>
  );
};

export default TransactionManager;
