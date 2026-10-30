// @vitest-environment node
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';
import { switchLocalePath } from './locale-cookie';

const request = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(new URL(path, 'http://localhost'), { headers });

describe('proxy — locale negotiation (I-1)', () => {
  it('lets locale-prefixed paths through', () => {
    expect(proxy(request('/ar/records/record-001')).headers.get('location')).toBeNull();
  });

  it('redirects to the Accept-Language preference, keeping the path', () => {
    const response = proxy(request('/records/record-001', { 'accept-language': 'ar-SA,ar;q=0.9,en;q=0.5' }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/ar/records/record-001');
  });

  it('prefers an explicit earlier choice (cookie) over the browser language', () => {
    const response = proxy(request('/', { 'accept-language': 'ar', cookie: 'locale=en' }));
    expect(response.headers.get('location')).toBe('http://localhost/en');
  });

  it('falls back to English for unsupported languages and junk cookies', () => {
    const response = proxy(request('/', { 'accept-language': 'fr-FR', cookie: 'locale=xx' }));
    expect(response.headers.get('location')).toBe('http://localhost/en');
  });
});

describe('switchLocalePath', () => {
  it('swaps only the locale segment', () => {
    expect(switchLocalePath('/en/records/record-001', 'ar')).toBe('/ar/records/record-001');
    expect(switchLocalePath('/ar', 'en')).toBe('/en');
    expect(switchLocalePath('/', 'ar')).toBe('/ar');
    expect(switchLocalePath('/records/x', 'en')).toBe('/en/records/x');
  });
});
