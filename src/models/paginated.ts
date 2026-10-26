
export default interface Paginated<T> {
    perPage?: number,
    totalItems?: number,
    totalPages?: number,
    items: T[]
}