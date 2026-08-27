export interface IApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    timestamp: string;
    statusCode: number;
    executionTimems: number;
}

export interface IApiErrorResponse {
    error: string;
    message: string | string[];
    success: boolean;
    path: string;
    timestamp: string;
    statusCode: number;
    executionTimems: number;
}