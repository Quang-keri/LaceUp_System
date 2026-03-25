import { useState, useEffect } from "react";
import { Input, Select, Button, ConfigProvider } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface SearchBarProps {
  initialTitle?: string;
  onSearch: (values: { title?: string; categoryIds?: number[] }) => void;
}

export default function SearchBar({ initialTitle, onSearch }: SearchBarProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  useEffect(() => {
    setTitle(initialTitle || "");
  }, [initialTitle]);

  const handleSearchClick = () => {
    onSearch({
      title: title,
      categoryIds: categoryId ? [categoryId] : undefined,
    });
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#9156F1",
          // CHÌA KHÓA Ở ĐÂY: Quản lý chiều cao và bo góc đồng bộ cho TẤT CẢ component
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
          <div className="flex-1 min-w-[300px] max-w-[600px] relative">
            <Input
              placeholder="Tìm tên sân, khu vực..."
              // Đã xóa h-12, rounded-[1rem] và border-none vì ConfigProvider đã lo
              className="w-full shadow-[0_2px_10px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] focus:shadow-[0_4px_15px_rgb(0,0,0,0.08)] transition-all text-base px-4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onPressEnter={handleSearchClick}
              allowClear
              prefix={<SearchOutlined className="text-gray-400 mr-2 text-lg" />}
            />
          </div>

          <Select
            placeholder="Môn thể thao"
            // Đã xóa h-12 và rounded-[1rem]
            className="w-48 shadow-[0_2px_10px_rgb(0,0,0,0.05)] hover:shadow-[0_4px_15px_rgb(0,0,0,0.08)] transition-all"
            allowClear
            value={categoryId}
            onChange={(value) => setCategoryId(value)}
            options={[
              { value: 1, label: " Cầu lông" },
              { value: 2, label: " Bóng đá" },
              { value: 3, label: " Pickleball" },
              { value: 4, label: " Tennis" },
            ]}
          />

          <Button
            type="primary"
            onClick={handleSearchClick}
            // Đã xóa h-12 và rounded-[1rem]
            className="px-8 font-bold bg-gradient-to-r from-[#9156F1] to-[#B0DF94] border-none hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
          >
            TÌM KIẾM
          </Button>
        </div>
      </div>
    </ConfigProvider>
  );
}
