import React, { useContext } from "react";
import { locationService } from "../../../service/locationService.ts";
import { CategoryContext } from "../../../context/CategoryContext";
import {
  Radio,
  Select,
  Button,
  Typography,
  Row,
  Col,
  Divider,
  Space,
} from "antd";

const { Title, Text } = Typography;

interface MatchFilterProps {
  sortOrder: string;
  setSortOrder: (value: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  selectedLocation: string;
  setSelectedLocation: (value: string) => void;
  selectedWard: string;
  setSelectedWard: (value: string) => void;
  provinces: any[];
  wards: any[];
  setWards: (value: any[]) => void;
  resetFilters: () => void;
}

const MatchFilter: React.FC<MatchFilterProps> = ({
  sortOrder,
  setSortOrder,
  selectedCategory,
  setSelectedCategory,
  typeFilter,
  setTypeFilter,
  selectedLocation,
  setSelectedLocation,
  selectedWard,
  setSelectedWard,
  provinces,
  wards,
  setWards,
  resetFilters,
}) => {
  const { categories, loading: isFetchingCategories } =
    useContext(CategoryContext);

  return (
    <div className="w-full lg:w-[300px] xl:w-1/5 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 shrink-0 lg:sticky lg:top-6 z-10">
      <div className="flex justify-between items-center mb-4">
        <Title
          level={4}
          style={{ margin: 0, fontWeight: 800, color: "#1e293b" }}
        >
          Bộ lọc
        </Title>
        <Button
          type="link"
          onClick={resetFilters}
          style={{ color: "#9156F1", padding: 0, fontWeight: 600 }}
          className="hover:opacity-80"
        >
          Làm mới
        </Button>
      </div>

      <Divider
        style={{ marginTop: 0, marginBottom: 24, borderColor: "#f1f5f9" }}
      />

      <div className="mb-6">
        <Text
          strong
          className="text-slate-800 text-sm uppercase tracking-wider block mb-3"
        >
          Sắp xếp
        </Text>
        <Radio.Group
          onChange={(e) => setSortOrder(e.target.value)}
          value={sortOrder}
        >
          <Space direction="vertical" size={12}>
            <Radio value="NEWEST" className="font-medium text-slate-600">
              Mới nhất
            </Radio>
            <Radio value="PRICE_ASC" className="font-medium text-slate-600">
              Giá thấp → cao
            </Radio>
            <Radio value="PRICE_DESC" className="font-medium text-slate-600">
              Giá cao → thấp
            </Radio>
          </Space>
        </Radio.Group>
      </div>

      <div className="mb-6">
        <Text
          strong
          className="text-slate-800 text-sm uppercase tracking-wider block mb-3"
        >
          Loại sân
        </Text>
        <Select
          size="large"
          showSearch
          allowClear
          placeholder="Tất cả loại sân"
          value={selectedCategory || undefined}
          onChange={(val) => setSelectedCategory(val || "")}
          style={{ width: "100%" }}
          loading={isFetchingCategories}
          options={categories.map((cat: any) => ({
            label: cat.categoryName,
            value: cat.categoryName,
          }))}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div className="mb-6">
        <Text
          strong
          className="text-slate-800 text-sm uppercase tracking-wider block mb-3"
        >
          Thể thức
        </Text>
        <Radio.Group
          onChange={(e) => setTypeFilter(e.target.value)}
          value={typeFilter}
          className="w-full"
        >
          <Row gutter={[8, 12]}>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "NORMAL", label: "Đánh thường" },
              { id: "BET", label: "Đánh kèo" },
              { id: "RANKED", label: "Đánh Rank" },
            ].map((type) => (
              <Col span={12} key={type.id}>
                <Radio
                  value={type.id}
                  className="font-medium text-slate-600 text-sm truncate"
                  title={type.label}
                >
                  {type.label}
                </Radio>
              </Col>
            ))}
          </Row>
        </Radio.Group>
      </div>

      <div className="mb-6">
        <Text
          strong
          className="text-slate-800 text-sm uppercase tracking-wider block mb-3"
        >
          Tỉnh / Thành phố
        </Text>
        <Select
          size="large"
          showSearch
          allowClear
          placeholder="Tất cả Tỉnh/Thành"
          value={selectedLocation || undefined}
          onChange={(name) => {
            if (!name) {
              setSelectedLocation("");
              setSelectedWard("");
              setWards([]);
              return;
            }
            setSelectedLocation(name);
            setSelectedWard("");
            setWards([]);

            const selectedProv = provinces.find((p) => p.name === name);
            if (selectedProv) {
              locationService
                .getWardsByProvince(selectedProv.code)
                .then((data) => setWards(data || []));
            }
          }}
          style={{ width: "100%" }}
          options={provinces.map((city) => ({
            label: city.name,
            value: city.name,
          }))}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>

      <div className="mb-2">
        <Text
          strong
          className="text-slate-800 text-sm uppercase tracking-wider block mb-3"
        >
          Phường / Xã
        </Text>
        <Select
          size="large"
          showSearch
          allowClear
          placeholder={
            selectedLocation ? "Tất cả Phường/Xã" : "Chọn Tỉnh/Thành trước"
          }
          value={selectedWard || undefined}
          onChange={(val) => setSelectedWard(val || "")}
          disabled={!selectedLocation || wards.length === 0}
          style={{ width: "100%" }}
          options={wards.map((ward) => ({
            label: ward.name,
            value: ward.name,
          }))}
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
        />
      </div>
    </div>
  );
};

export default MatchFilter;
