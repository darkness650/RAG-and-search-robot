import { useLocation, useParams, useSearchParams } from "react-router-dom";
import { useMemo } from "react";

type URLData = {
  pathname: string;
  searchParams: URLSearchParams;
  hash: string;
  params: Record<string, string | undefined>;
  fullPath: string;
};

export const useURL = (): URLData => {
  const location = useLocation();
  const [searchParams]= useSearchParams();
  const params = useParams();

  return useMemo(() => ({
    pathname: location.pathname,
    searchParams,
    hash: location.hash,
    params,
    fullPath: `${location.pathname}${location.search}${location.hash}`
  }),[location, searchParams, params]);
}