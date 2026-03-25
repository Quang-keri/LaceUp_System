import { Slider, Checkbox, Radio, ConfigProvider } from "antd";
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
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1", // Màu tím chủ đạo
          borderRadius: 8, // Bo góc các component của AntD
          fontFamily: "inherit",
        },
      }}
    >
      {/* Bao bọc ngoài cùng: Dùng h-fit để không bị kéo giãn, thêm bóng đổ (shadow) mềm mại */}
      <div className="h-fit bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-6 flex flex-col gap-6">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-gray-800">Bộ lọc</h3>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold text-gray-400 hover:text-[#9156F1] transition-colors underline underline-offset-2"
          >
            Làm mới
          </button>
        </div>

        {/* KHOẢNG GIÁ */}
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-bold text-gray-700">Khoảng giá / giờ</h4>
          <div className="px-2">
            <Slider
              range
              min={0}
              max={500000}
              step={10000}
              // Dùng value thay vì defaultValue để UI cập nhật khi bấm "Làm mới" hoặc xoá filter
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

        {/* SẮP XẾP */}
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

        {/* KHU VỰC */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Khu vực</h4>
          <Checkbox.Group
            className="grid grid-cols-2 gap-2"
            value={filters.cityIds}
            onChange={(values: CheckboxValueType[]) =>
              onChange({ cityIds: values as number[] })
            }
          >
            <Checkbox
              value={1}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              TP.HCM
            </Checkbox>
            <Checkbox
              value={2}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Hà Nội
            </Checkbox>
            <Checkbox
              value={3}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Đà Nẵng
            </Checkbox>
            <Checkbox
              value={4}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Bình Dương
            </Checkbox>
          </Checkbox.Group>
        </div>

        {/* LOẠI SÂN */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Loại sân</h4>
          <Checkbox.Group
            className="grid grid-cols-2 gap-2"
            value={filters.categoryIds}
            onChange={(values: CheckboxValueType[]) =>
              onChange({ categoryIds: values as number[] })
            }
          >
            <Checkbox
              value={1}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Cầu lông
            </Checkbox>
            <Checkbox
              value={2}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Bóng đá
            </Checkbox>
            <Checkbox
              value={3}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Pickleball
            </Checkbox>
            <Checkbox
              value={4}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Tennis
            </Checkbox>
          </Checkbox.Group>
        </div>

        {/* TIỆN NGHI */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-gray-700">Tiện nghi</h4>
          <Checkbox.Group
            className="grid grid-cols-2 gap-2"
            value={filters.amenityIds}
            onChange={(values: CheckboxValueType[]) =>
              onChange({ amenityIds: values as number[] })
            }
          >
            <Checkbox
              value={1}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Trà đá
            </Checkbox>
            <Checkbox
              value={2}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Bãi giữ xe
            </Checkbox>
            <Checkbox
              value={3}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Ổ điện
            </Checkbox>
            <Checkbox
              value={4}
              className="m-0 px-2 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
            >
              Thuê vợt
            </Checkbox>
          </Checkbox.Group>
        </div>
      </div>
    </ConfigProvider>
  );
}
