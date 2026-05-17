import { Slider, Checkbox, Radio, Select, ConfigProvider, Rate } from "antd";
import type { CheckboxValueType } from "antd/es/checkbox/Group";
import type { FilterState } from "./PostPage";
import { useEffect, useState } from "react";

import { locationService } from "../../../service/locationService";
import categoryService from "../../../service/categoryService";
import amenityService from "../../../service/amenityService";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (newFilters: Partial<FilterState>) => void;
}

export default function FilterSidebar({
  filters,
  onChange,
}: FilterSidebarProps) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);

  useEffect(() => {
    fetchProvinces();
    fetchCategories();
    fetchAmenities();
  }, []);

  const fetchProvinces = async () => {
    try {
      const result = await locationService.getProvinces();
      setProvinces(result || []);
    } catch (e) {
      console.error(e);
      setProvinces([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoryService.getAllCategories(1, 100);
      if (res.result?.data) setCategories(res.result.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAmenities = async () => {
    try {
      const res = await amenityService.getAllAmenities();
      if (res.result) setAmenities(res.result);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1",
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      <div className="h-fit bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-800">Bộ lọc</h3>
        </div>

        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-gray-700">Khoảng giá / giờ</h4>

          <div className="px-2">
            <Slider
              range
              min={0}
              max={500000}
              step={10000}
              value={[filters.minPrice || 0, filters.maxPrice || 500000]}
              onChange={(value: number[]) => {
                onChange({ minPrice: value[0], maxPrice: value[1] });
              }}
            />
          </div>

          <div className="flex justify-between text-xs font-medium text-gray-500">
            <span>0đ</span>
            <span>500k+</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Sắp xếp</h4>

          <Radio.Group
            className="flex flex-col gap-1"
            value={filters.sortBy}
            onChange={(e) => onChange({ sortBy: e.target.value })}
          >
            <Radio
              value="newest"
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Mới nhất
            </Radio>

            <Radio
              value="price_low"
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Giá thấp → cao
            </Radio>

            <Radio
              value="price_high"
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Giá cao → thấp
            </Radio>
          </Radio.Group>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Đánh giá</h4>

          <Radio.Group
            className="flex flex-col gap-2"
            value={filters.minRating}
            onChange={(e) =>
              onChange({
                minRating: e.target.value,
              })
            }
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Radio
                key={star}
                value={star}
                className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50"
              >
                <div className="inline-flex items-center gap-2">
                  <Rate disabled value={star} style={{ fontSize: 14 }} />
                  <span>{star} sao</span>
                </div>
              </Radio>
            ))}

            <Radio
              value={0}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50"
            >
              Tất cả
            </Radio>
          </Radio.Group>
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Khu vực</h4>

          <Select
            mode="multiple"
            placeholder="Chọn khu vực"
            value={filters.provinceCodes}
            onChange={(values: number[]) => onChange({ provinceCodes: values })}
            style={{ width: "100%" }}
            showSearch
            optionFilterProp="label"
            options={provinces.map((p: any) => ({
              label: p.name,
              value: p.code,
            }))}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Loại sân</h4>

          <Select
            mode="multiple"
            placeholder="Chọn loại sân"
            value={filters.categoryIds}
            onChange={(values: number[]) => onChange({ categoryIds: values })}
            style={{ width: "100%" }}
            options={categories.map((c: any) => ({
              label: c.categoryName,
              value: c.categoryId,
            }))}
          />
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Tiện nghi</h4>

          <Checkbox.Group
            className="grid grid-cols-2 gap-2"
            value={filters.amenityIds}
            onChange={(values: CheckboxValueType[]) =>
              onChange({ amenityIds: values as number[] })
            }
          >
            {amenities.map((a: any) => (
              <Checkbox
                key={a.amenityId}
                value={a.amenityId}
                className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {a.amenityName}
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      </div>
    </ConfigProvider>
  );
}
