export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function ok<T>(data: T) {
  return { success: true as const, data };
}

export function fail(code: string, message: string) {
  return { success: false as const, error: { code, message } };
}
