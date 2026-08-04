import { HttpStatus } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';
import {
  BrandAlreadyExistsError,
  BrandNotFoundError,
} from '../../brands/errors/brand-errors';

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

  it('maps BrandNotFoundError using status and code on the error', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const error = new BrandNotFoundError('id-1');

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

  it('maps BrandAlreadyExistsError using status and code on the error', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const error = new BrandAlreadyExistsError('samsung');

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
