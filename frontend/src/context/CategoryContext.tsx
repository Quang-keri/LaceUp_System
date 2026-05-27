import React, {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { CategoryResponse } from "../types/category";
import categoryService from "../service/categoryService";

interface CategoryContextType {
  categories: CategoryResponse[];
  loading: boolean;
}

export const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  loading: true,
});

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getAllCategories(1, 100);

        const data = response.result?.data;
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, loading }}>
      {children}
    </CategoryContext.Provider>
  );
};
