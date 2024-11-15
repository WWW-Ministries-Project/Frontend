export interface Requisition {
    comment: string 
    currency: string
    department_id: number
    event_id: number
    id: number
    approval_status: string
    requisition_id: string
    date_created: string
    user_id: number
    product_names: string[]
}