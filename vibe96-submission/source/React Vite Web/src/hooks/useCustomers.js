import { useQuery } from '@tanstack/react-query';
import { getCustomersApi, getCustomerApi } from '../api/customers';

export function useCustomers(params = {}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => getCustomersApi(params).then(r => r.data),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerApi(id).then(r => r.data),
    enabled: !!id,
  });
}
