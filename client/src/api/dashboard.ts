import { apiClient } from '.'
import { DashboardData } from '../types/dashboard'

export async function getDashboardData(): Promise<DashboardData> {
  return apiClient.get('/dashboard')
}
