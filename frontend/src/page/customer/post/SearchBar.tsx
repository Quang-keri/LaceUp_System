import { Input, Select, Button } from "antd";

export default function SearchBar() {
  return (
    <div className="sticky top-0 z-40 bg-[#8dd1ef] shadow">
      <div className="max-w-[90vw] mx-auto flex flex-wrap gap-3 p-4">
        <Input placeholder="Tìm khu vực..." className="flex-1 min-w-[200px]" />

        <Select
          placeholder="Loại sân"
          className="w-48"
          options={[
            { value: "badminton", label: "Cầu lông" },
            { value: "football", label: "Bóng đá" },
            { value: "pickleball", label: "Pickleball" },
          ]}
        />

        <Button type="primary">Tìm kiếm</Button>
      </div>
    </div>
  );
}
