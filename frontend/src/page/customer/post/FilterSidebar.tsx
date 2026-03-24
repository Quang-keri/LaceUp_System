import { Slider, Checkbox, Radio, Divider } from "antd";
import type { CheckboxValueType } from "antd/es/checkbox/Group";
import type { FilterState } from "./PostPage";

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (newFilters: Partial<FilterState>) => void;
}

export default function FilterSidebar({
  filters,
  onChange,
}: FilterSidebarProps) {
  // LƯU Ý: Các value trong Checkbox dưới đây cần là ID tương ứng trong database!
  return (
    <div className="p-5 space-y-6 shadow-sm bg-white rounded-md border">
      <h3 className="text-lg font-bold">Bộ lọc</h3>

      {/* KHOẢNG GIÁ */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Khoảng giá / giờ</h3>
        <Slider
          range
          min={0}
          max={500000}
          step={10000}
          defaultValue={[0, 500000]}
          onAfterChange={(value: number[]) => {
            onChange({ minPrice: value[0], maxPrice: value[1] });
          }}
        />
        <div className="flex justify-between text-sm text-gray-500">
          <span>0đ</span>
          <span>500k+</span>
        </div>
      </div>

      <Divider className="my-3" />

      {/* SẮP XẾP */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Sắp xếp</h3>
        <Radio.Group
          className="flex flex-col gap-2"
          value={filters.sortBy}
          onChange={(e) => onChange({ sortBy: e.target.value })}
        >
          <Radio value="newest">Mới nhất</Radio>
          <Radio value="price_low">Giá thấp → cao</Radio>
          <Radio value="price_high">Giá cao → thấp</Radio>
        </Radio.Group>
      </div>

      <Divider className="my-3" />

      {/* LOCATION (CITY ID) */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Khu vực</h3>
        <Checkbox.Group
          className="grid grid-cols-2 gap-2"
          value={filters.cityIds}
          onChange={(values: CheckboxValueType[]) =>
            onChange({ cityIds: values as number[] })
          }
        >
          <Checkbox value={1}>TP.HCM</Checkbox>
          <Checkbox value={2}>Hà Nội</Checkbox>
          <Checkbox value={3}>Đà Nẵng</Checkbox>
          <Checkbox value={4}>Bình Dương</Checkbox>
        </Checkbox.Group>
      </div>

      <Divider />

      {/* CATEGORY ID */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Loại sân</h3>
        <Checkbox.Group
          className="grid grid-cols-2 gap-2"
          value={filters.categoryIds}
          onChange={(values: CheckboxValueType[]) =>
            onChange({ categoryIds: values as number[] })
          }
        >
          <Checkbox value={1}>Cầu lông</Checkbox>
          <Checkbox value={2}>Bóng đá</Checkbox>
          <Checkbox value={3}>Pickleball</Checkbox>
          <Checkbox value={4}>Tennis</Checkbox>
        </Checkbox.Group>
      </div>

      <Divider className="my-3" />

      {/* AMENITY ID */}
      <div>
        <h3 className="font-semibold mb-3 text-gray-700">Tiện nghi</h3>
        <Checkbox.Group
          className="grid grid-cols-2 gap-2"
          value={filters.amenityIds}
          onChange={(values: CheckboxValueType[]) =>
            onChange({ amenityIds: values as number[] })
          }
        >
          <Checkbox value={1}>Trà đá</Checkbox>
          <Checkbox value={2}>Bãi giữ xe</Checkbox>
          <Checkbox value={3}>Ổ điện</Checkbox>
          <Checkbox value={4}>Thuê vợt</Checkbox>
        </Checkbox.Group>
      </div>
      <Divider className="my-3" />
    </div>
  );
}
