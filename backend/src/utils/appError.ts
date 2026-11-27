class appError extends Error {
  public readonly statusCode    : number;
  public readonly status        : "fail" | "error";
  public readonly isOperational : boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode    = statusCode;
    this.status        = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    if ("captureStackTrace" in Error && typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack ?? "";
    }
  }
}

export default appError;