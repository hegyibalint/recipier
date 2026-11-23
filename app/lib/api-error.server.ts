export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: { path: string; message: string }[],
  ) {
    super(message);
  }

  response() {
    return Response.json({
      error: { code: this.code, message: this.message, ...(this.issues && { issues: this.issues }) },
    }, { status: this.status });
  }
}
