import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    name: z.string().min(1),
  });
  const pipe = new ZodValidationPipe(schema);

  it('returns parsed data when valid', () => {
    expect(pipe.transform({ name: 'samsung' })).toEqual({ name: 'samsung' });
  });

  it('throws BadRequestException with VALIDATION_ERROR when invalid', () => {
    try {
      pipe.transform({ name: '' });
      fail('expected pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
        message: string;
        details: unknown[];
      };
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.message).toBe('Validation failed');
      expect(Array.isArray(response.details)).toBe(true);
    }
  });
});
