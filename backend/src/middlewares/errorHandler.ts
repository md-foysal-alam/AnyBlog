import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    const statusCode =
        Number(err?.statusCode) ||
        Number(err?.status)     ||
        500;

    if (statusCode >= 500) console.error("Error:", err);

    res.status(statusCode).json({
        success : false,
        message : err?.message || "Internal server error",
    });
};

export const notFound = (req: any, res: any) => {
    res.status(404).json({
        success : false,
        message : `Route ${req.method} ${req.originalUrl} not found`,
    });
};