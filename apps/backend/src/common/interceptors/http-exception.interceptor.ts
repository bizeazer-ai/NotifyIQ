// apps/backend/src/common/filters/http-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { IApiErrorResponse } from '../interfaces/api-response-interfaces';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const startTime = (request as any).startTime || Date.now();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'InternalServerError';

    // Handle explicit NestJS HttpExceptions (e.g. BadRequestException, NotFoundException)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resBody = exception.getResponse() as any;
      
      message = resBody?.message || exception.message;
      error = resBody?.error || exception.name;
    } 
    // Handle Payload / Entity Too Large (413) from body-parser, multer, or raw-body
    else if (
      (exception as any)?.type === 'entity.too.large' ||
      (exception as any)?.status === 413 ||
      (exception as any)?.statusCode === 413 ||
      (exception as any)?.name === 'PayloadTooLargeError' ||
      ((exception as any)?.message && typeof (exception as any).message === 'string' && (exception as any).message.toLowerCase().includes('entity too large'))
    ) {
      statusCode = HttpStatus.PAYLOAD_TOO_LARGE;
      error = 'PayloadTooLargeError';
      message = 'Uploaded payload or file exceeds the allowed size limit. WhatsApp limits: 5MB for images, 16MB for audio/video, 25MB for documents.';
      console.warn(`[GlobalExceptionFilter] 413 Payload Too Large on ${request.method} ${request.url}: ${(exception as any)?.message || 'Limit exceeded'}`);
    }
    // Example: Cleanly catch validation errors or unexpected operational failures
    else if (exception instanceof Error) {
      // In development, you might want to log this out to your terminal container stream
      console.error('💥 Unhandled Runtime Exception:', exception);
      
      message = exception.message;
      error = exception.name;
    }

    const errorPayload: IApiErrorResponse = {
      success: false,
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
      executionTimems: Date.now() - startTime || 0,
    };

    response.status(statusCode).json(errorPayload);
  }
}
