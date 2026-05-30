import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import newsService from "../../../service/newsService";
import UserNewsCard from "./UserNewsCard";
import type { NewsItem } from "../../../types/news";

export default function UserNewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await newsService.getAll(0, 10, keyword);
      const list = res.data || res.content || [];
      setNews(list);
    } catch (err) {
      console.error("Fetch news error", err);
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchNews();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Tin Tức Thể Thao
            </h1>
            <p className="text-base text-gray-500 mt-2">
              Cập nhật những bài viết và sự kiện mới nhất
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {news.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                <Search size={48} className="text-gray-300 mb-4" />
                <p className="text-lg">Không tìm thấy bài viết nào phù hợp.</p>
              </div>
            ) : (
              news.map((item) => <UserNewsCard key={item.id} item={item} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
