import { API_URL } from './constants';
import { DashboardSummary, ParsedReceipt, Receipt, ReceiptItem } from './types';

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Something went wrong — please try again.');
  return data as T;
}

export async function uploadReceipt(imageUri: string, mimeType: string): Promise<ParsedReceipt> {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: mimeType,
    name: 'receipt.jpg',
  } as unknown as Blob);

  const res = await fetch(`${API_URL}/api/receipts/upload`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse<ParsedReceipt>(res);
}

export async function confirmReceipt(data: {
  store_name?: string;
  purchased_at?: string;
  total_amount?: number;
  image_url?: string;
  items: ReceiptItem[];
}): Promise<{ id: string }> {
  const res = await fetch(`${API_URL}/api/receipts/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<{ id: string }>(res);
}

export async function fetchReceipts(): Promise<Receipt[]> {
  const res = await fetch(`${API_URL}/api/receipts`);
  return handleResponse<Receipt[]>(res);
}

export async function fetchDashboard(days: number): Promise<DashboardSummary> {
  const res = await fetch(`${API_URL}/api/dashboard/summary?days=${days}`);
  return handleResponse<DashboardSummary>(res);
}
