export class ApiError extends Error {
  // 0 means no response at all (network failure, timeout)
  readonly status: number
  // Parsed response body as sent by the server, shape is up to the caller
  readonly data: unknown

  constructor(message: string, status: number, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}
