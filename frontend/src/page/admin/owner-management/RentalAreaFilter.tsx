import React, { useEffect, useState } from "react";
import { Space, Input, Select, Button } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { locationService } from "../../../service/locationService";

interface Props {
  keyword: string;
  setKeyword: (val: string) => void;
  setStatusFilter: (val: string | undefined) => void;
  provinceCode: number | undefined;
  setProvinceCode: (val: number | undefined) => void;
  ward: string | undefined;
  setWard: (val: string | undefined) => void;
  onSearch: () => void;
}

const RentalAreaFilter: React.FC<Props> = ({
  keyword,
  setKeyword,
  setStatusFilter,
  provinceCode,
  setProvinceCode,
  ward,
  setWard,
  onSearch,
}) => {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    locationService.getProvinces().then((data) => {
      setProvinces(data || []);
    });
  }, []);

  useEffect(() => {
    if (provinceCode) {
      setLoadingWards(true);
      locationService.getWardsByProvince(provinceCode).then((data) => {
        setWards(data || []);
        setLoadingWards(false);
      });
    } else {
      setWards([]);
    }
  }, [provinceCode]);

  const handleProvinceChange = (val: number | undefined) => {
    setProvinceCode(val);
    setWard(undefined);
  };

  return (
    <Space style={{ marginBottom: 16, display: "flex", flexWrap: "wrap" }}>
      <Input
        placeholder="Tìm tên, địa chỉ..."
        prefix={<SearchOutlined />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onPressEnter={onSearch}
        style={{ width: 300 }}
        allowClear
      />

      <Select
        placeholder="Trạng thái"
        style={{ width: 130 }}
        allowClear
        onChange={(val) => setStatusFilter(val)}
      >
        <Select.Option value="PENDING">Chờ duyệt</Select.Option>
        <Select.Option value="VERIFIED">Đã duyệt</Select.Option>
        <Select.Option value="REJECTED">Từ chối</Select.Option>
      </Select>

      <Select
        placeholder="Tỉnh / Thành phố"
        style={{ width: 180 }}
        allowClear
        showSearch
        optionFilterProp="children"
        value={provinceCode}
        onChange={handleProvinceChange}
      >
        {provinces.map((p) => (
          <Select.Option key={p.code} value={p.code}>
            {p.name}
          </Select.Option>
        ))}
      </Select>

      <Select
        placeholder="Phường / Xã"
        style={{ width: 180 }}
        allowClear
        showSearch
        optionFilterProp="children"
        value={ward}
        onChange={(val) => setWard(val)}
        disabled={!provinceCode || loadingWards}
        loading={loadingWards}
      >
        {wards.map((w) => (
          <Select.Option key={w.code} value={w.name}>
            {w.name}
          </Select.Option>
        ))}
      </Select>

      <Button
        type="primary"
        onClick={onSearch}
        style={{ background: "#007acc", borderColor: "#007acc" }}
      >
        Tìm kiếm
      </Button>
    </Space>
  );
};

export default RentalAreaFilter;
