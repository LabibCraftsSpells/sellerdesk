import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStatsApi, getRevenueReportApi,
  getProfitReportApi, getOrdersChartApi, getTopProductsApi
} from '../api/reports';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStatsApi().then(r => r.data),
    staleTime: 1000 * 60 * 2,
  });
}

export function useRevenueReport(params) {
  return useQuery({
    queryKey: ['revenue-report', params],
    queryFn: () => getRevenueReportApi(params).then(r => r.data),
    enabled: !!(params?.from && params?.to),
  });
}

export function useProfitReport(params) {
  return useQuery({
    queryKey: ['profit-report', params],
    queryFn: () => getProfitReportApi(params).then(r => r.data),
    enabled: !!(params?.from && params?.to),
  });
}

export function useOrdersChart(params) {
  return useQuery({
    queryKey: ['orders-chart', params],
    queryFn: () => getOrdersChartApi(params).then(r => r.data),
  });
}

export function useTopProducts(params) {
  return useQuery({
    queryKey: ['top-products', params],
    queryFn: () => getTopProductsApi(params).then(r => r.data),
  });
}
