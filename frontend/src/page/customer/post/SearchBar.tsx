import { useState, useEffect, useContext } from "react";
import { Input, Select, Button, ConfigProvider } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FilterState } from "./PostPage";
import { locationService } from "../../../service/locationService";
import { CategoryContext } from "../../../context/CategoryContext";

interface SearchBarProps {
  initialTitle?: string;
  onSearch: (values: {
    title?: string;
    categoryIds?: number[];
    provinceCodes?: number[];
  }) => void;
  onTitleChange?: (title: string) => void;
  filters?: FilterState;
  onFiltersChange?: (newFilters: Partial<FilterState>) => void;
}

export default function SearchBar({
  initialTitle,
  onSearch,
  onTitleChange,
  filters,
}: SearchBarProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [provinceCode, setProvinceCode] = useState<number | undefined>(
    undefined,
  );

  const [provinces, setProvinces] = useState<any[]>([]);

  const { categories, loading: categoriesLoading } =
    useContext(CategoryContext);

  useEffect(() => {
    setTitle(initialTitle || "");
  }, [initialTitle]);

  useEffect(() => {
    if (onTitleChange) onTitleChange(title);
  }, [title, onTitleChange]);

  useEffect(() => {
    fetchProvinces();
  }, []);

  useEffect(() => {
    setCategoryId(filters?.categoryIds?.[0]);
    setProvinceCode(filters?.provinceCodes?.[0]);
  }, [filters?.categoryIds, filters?.provinceCodes]);

  const fetchProvinces = async () => {
    try {
      const result = await locationService.getProvinces();
      setProvinces(result || []);
    } catch (error) {
      console.error(error);
      setProvinces([]);
    }
  };

  const handleSearchClick = () => {
    onSearch({
      title,
      categoryIds: categoryId ? [categoryId] : undefined,
      provinceCodes: provinceCode ? [provinceCode] : undefined,
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1",
          borderRadius: 16,
          controlHeight: 48,
        },
        components: {
          Select: {
            colorBorder: "transparent",
            hoverBorderColor: "transparent",
            activeBorderColor: "transparent",
          },
          Input: {
            colorBorder: "transparent",
            hoverBorderColor: "transparent",
            activeBorderColor: "transparent",
          },
        },
      }}
    >
      <div className="w-full bg-transparent transition-all">
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-4 px-5">
          <div className="flex-1 min-w-[300px] max-w-[500px] relative">
            <Input
              placeholder="Tìm tên sân, khu vực..."
              className="w-full shadow-[0_2px_10px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] focus:shadow-[0_4px_15px_rgb(0,0,0,0.08)] transition-all text-base px-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPressEnter={handleSearchClick}
              allowClear
              prefix={<SearchOutlined className="text-gray-400 mr-2 text-lg" />}
            />
          </div>

          <Select
            placeholder="Khu vực"
            className="w-52 shadow-[0_2px_10px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] transition-all"
            allowClear
            showSearch
            optionFilterProp="label"
            value={provinceCode}
            onChange={(value) => setProvinceCode(value)}
            options={provinces.map((p) => ({
              value: p.code,
              label: p.name,
            }))}
          />

          <Select
            placeholder="Môn thể thao"
            className="w-48 shadow-[0_2px_10px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] transition-all"
            allowClear
            showSearch
            optionFilterProp="label"
            value={categoryId}
            onChange={(value) => setCategoryId(value)}
            loading={categoriesLoading}
            options={categories.map((c: any) => ({
              value: c.categoryId,
              label: c.categoryName,
            }))}
          />

          <Button
            type="primary"
            onClick={handleSearchClick}
            className="px-8 font-bold bg-gradient-to-r from-[#9156F1] to-[#B0DF94] border-none hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
          >
            TÌM KIẾM
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
}
