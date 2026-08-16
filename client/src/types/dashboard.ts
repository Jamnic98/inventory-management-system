export interface DashboardData {
  useFirstList: Array<{
    id: number
    itemLabel: string
    locationLabel: string
    quantity: number
    openedOn: string
    daysRemaining: number
  }>
  restockList: Array<any>
  locationSummaries: Array<any>
}
