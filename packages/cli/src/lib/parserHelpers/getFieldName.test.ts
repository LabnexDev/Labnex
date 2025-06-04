import { getFieldName } from './getFieldName';

describe('getFieldName', () => {
  it('should return username when pattern contains username', () => {
    expect(getFieldName(/username/i)).toBe('username');
  });

  it('should return email when pattern contains email', () => {
    expect(getFieldName(/email|mail/i)).toBe('email');
  });

  it('should return text when pattern does not contain known fields', () => {
    expect(getFieldName(/random/i)).toBe('text');
  });
});
