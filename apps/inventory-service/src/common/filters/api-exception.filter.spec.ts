import { HttpStatus } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';
import {
  StockAlreadyExistsError,
  StockNotFoundError,
} from '../../stocks/errors/stock-errors';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  function createHost(response: {
    status: jest.Mock;
    json: jest.Mock;
  }) {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
      }),
    } as never;
  }

  it('maps StockNotFoundError using status and code on the error', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const error = new StockNotFoundError('id-1');

    filter.catch(error, createHost({ status, json }));

    expect(status).toHaveBeenCalledWith(error.status);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    expect(error.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('maps StockAlreadyExistsError using status and code on the error', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const error = new StockAlreadyExistsError('product-1');

    filter.catch(error, createHost({ status, json }));

    expect(status).toHaveBeenCalledWith(error.status);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
    expect(error.status).toBe(HttpStatus.CONFLICT);
  });
});
