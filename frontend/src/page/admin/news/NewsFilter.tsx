interface NewsFilterProps {
  onSearch: (value: string) => void;
}

export default function NewsFilter({ onSearch }: NewsFilterProps) {
  return (
    <div className="w-full md:w-1/3">
      <input
        type="text"
        placeholder="Tìm kiếm theo tiêu đề..."
        onChange={(e) => {
          onSearch(e.target.value);
        }}
        className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm"
      />
    </div>
  );
}
