import { ok, okList } from './api-response';

describe('api-response helpers', () => {
  it('ok wraps data with success true', () => {
    expect(ok({ id: '1' })).toEqual({
      success: true,
      data: { id: '1' },
    });
  });

  it('okList wraps items and meta', () => {
    expect(okList([{ id: '1' }], { page: 1, limit: 10, total: 1 })).toEqual({
      success: true,
      data: [{ id: '1' }],
      meta: { page: 1, limit: 10, total: 1 },
    });
  });
});
