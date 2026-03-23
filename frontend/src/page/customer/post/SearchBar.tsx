import { Input, Select, Button } from "antd";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (values: { title?: string; categoryIds?: number[] }) => void;
  initialTitle?: string;
}

export default function SearchBar({
  onSearch,
  initialTitle = "",
}: SearchBarProps) {
  const [title, setTitle] = useState(initialTitle);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

  const handleSearch = () => {
    onSearch({
      title: title || undefined,
      categoryIds: categoryId ? [categoryId] : undefined,
    });
  };

  return (
    <div className="sticky top-0 z-40 bg-[#8dd1ef] shadow">
      <div className="max-w-[90vw] mx-auto flex flex-wrap gap-3 p-4">
        <Input
          placeholder="Tìm tên sân, khu vực..."
          className="flex-1 min-w-[200px]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onPressEnter={handleSearch}
          allowClear
        />

        <Select
          placeholder="Loại sân"
          className="w-48"
          allowClear
          value={categoryId}
          onChange={(value) => setCategoryId(value)}
          options={[
            // LƯU Ý: Khớp ID với database
            { value: 1, label: "Cầu lông" },
            { value: 2, label: "Bóng đá" },
            { value: 3, label: "Pickleball" },
            { value: 4, label: "Tennis" },
          ]}
        />

        <Button type="primary" onClick={handleSearch}>
          Tìm kiếm
        </Button>
      </div>
    </div>
  );
}
