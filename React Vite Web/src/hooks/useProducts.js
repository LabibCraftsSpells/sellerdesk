import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProductsApi, getProductApi, createProductApi,
  updateProductApi, deleteProductApi, adjustStockApi, getLowStockProductsApi
} from '../api/products';

export function useProducts(params = {}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => getProductsApi(params).then(r => r.data),
  });
}

export function useProduct(id) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductApi(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: () => getLowStockProductsApi().then(r => r.data),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createProductApi(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProductApi(id, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteProductApi(id).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adjustStockApi(id, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); },
  });
}
