import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

type RawParams = Record<string, string | null>;

function parseArrayParam(value?: string | null) {
  if (!value) return undefined;

  const arr = value
    .split(",")
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  return arr.length > 0 ? arr : undefined;
}

export interface FilterState {
  title?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;

  provinceCodes?: number[];

  categoryIds?: number[];
  amenityIds?: number[];
  date?: string;
  startDateTime?: string;
  endDateTime?: string;
  page: number;
  size: number;
  minRating?: number;
}

export default function useUrlFilters(defaults: Partial<FilterState> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsed: FilterState = useMemo(() => {
    const p = Object.fromEntries(searchParams.entries()) as RawParams;

    return {
      title: p.title || undefined,
      date: p.date || undefined,
      startDateTime: p.startDateTime || undefined,
      endDateTime: p.endDateTime || undefined,

      minPrice: p.minPrice ? Number(p.minPrice) : undefined,
      maxPrice: p.maxPrice ? Number(p.maxPrice) : undefined,

      minRating: p.minRating ? Number(p.minRating) : undefined,

      sortBy: p.sortBy || undefined,

      provinceCodes: parseArrayParam(p.provinceCodes),

      categoryIds: parseArrayParam(p.categoryIds),
      amenityIds: parseArrayParam(p.amenityIds),

      page: p.page ? Number(p.page) : defaults.page || 1,
      size: p.size ? Number(p.size) : defaults.size || 10,
    };
  }, [searchParams, defaults.page, defaults.size]);

  const setFilters = (patch: Partial<FilterState>) => {
    const next = new URLSearchParams(searchParams.toString());

    Object.entries(patch).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        next.delete(key);
        return;
      }

      if (Array.isArray(value)) {
        next.set(key, value.join(","));
        return;
      }

      next.set(key, String(value));
    });

    if (patch.page === undefined) {
      next.set("page", "1");
    }

    setSearchParams(next, { replace: true });
  };

  return { filters: parsed, setFilters } as const;
}
