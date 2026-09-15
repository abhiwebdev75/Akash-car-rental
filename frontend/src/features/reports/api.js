import { apiClient } from '../../lib/apiClient';

// Read-only reporting aggregations (finance roles). Every figure is computed by
// the backend from the database — the client only picks the range.
export const reportsApi = {
  // { range:{from,to}, totalRevenue, byDay:[{date,revenue,payments}] }
  async revenue(params = {}) {
    const { data } = await apiClient.get('/reports/revenue', { params });
    return data.data;
  },

  // { range, total, byStatus:{ STATUS:{count,value} } }
  async bookings(params = {}) {
    const { data } = await apiClient.get('/reports/bookings', { params });
    return data.data;
  },

  // { range, rangeDays, averageUtilization, perVehicle:[{vehicle,registrationNumber,bookedDays,utilization}] }
  async utilization(params = {}) {
    const { data } = await apiClient.get('/reports/utilization', { params });
    return data.data;
  },

  // { totalOutstanding, count, rows:[{bookingNumber,customer,phone,totalAmount,amountPaid,outstanding,paymentStatus}] }
  async outstanding(params = {}) {
    const { data } = await apiClient.get('/reports/outstanding', { params });
    return data.data;
  },

  // Fetch a report as CSV (as a Blob). We go through the authenticated client
  // rather than a plain anchor so the access token is attached.
  async downloadCsv(kind, params = {}) {
    const { data } = await apiClient.get(`/reports/${kind}`, {
      params: { ...params, format: 'csv' },
      responseType: 'blob',
    });
    return data;
  },
};
