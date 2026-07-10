/**
 * 이음 API HTTP 클라이언트 — fetch 기반 (외부 패키지 의존 0, RN 내장 fetch 사용).
 *
 * ── BASE URL 안내 ──────────────────────────────────────────────────────
 * - 웹(expo web)        : http://localhost:8000  (기본값)
 * - Android 에뮬레이터   : http://10.0.2.2:8000   (에뮬레이터의 localhost는 "기기 자신")
 * - iOS 시뮬레이터       : http://localhost:8000
 * - 실기기(Expo Go): Metro 호스트(hostUri)에서 PC IP를 자동 감지해 :8000으로 접속.
 *     (PC와 기기가 같은 Wi-Fi + Windows에서 8000/8081 인바운드 허용·포트프록시 필요)
 *     자동 감지가 안 되는 환경이면 setApiBase('http://<PC-LAN-IP>:8000') 수동 지정.
 * ──────────────────────────────────────────────────────────────────────
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Expo Go/개발빌드에서 Metro 번들을 내려준 호스트(PC)의 IP. 실패 시 null */
function devServerHost(): string | null {
  const hostUri: string | undefined = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  return host || null;
}

const DEFAULT_BASE_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8000'
    : `http://${devServerHost() ?? 'localhost'}:8000`;

let baseUrl = DEFAULT_BASE_URL;

/** 런타임에 API 서버 주소 교체 (실기기 LAN IP 등). 끝의 '/'는 제거된다. */
export function setApiBase(url: string): void {
  baseUrl = url.replace(/\/+$/, '');
}

export function getApiBase(): string {
  return baseUrl;
}

/** 기본 요청 타임아웃 (ms) */
export const DEFAULT_TIMEOUT_MS = 5000;

/** API 호출 실패(네트워크/타임아웃/4xx/5xx) 시 throw되는 에러 */
export class ApiError extends Error {
  /** HTTP 상태 코드. 네트워크/타임아웃 실패면 null */
  status: number | null;
  /** 서버가 준 에러 본문 (FastAPI: { detail: ... }) */
  body: unknown;

  constructor(message: string, status: number | null = null, body: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: QueryParams): string {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const pairs = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return pairs.length > 0 ? `${url}?${pairs.join('&')}` : url;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** JSON 직렬화되어 body로 전송 */
  body?: unknown;
  query?: QueryParams;
  timeoutMs?: number;
}

/**
 * 공통 요청 함수. 실패 시 항상 ApiError를 throw한다.
 * - 타임아웃: AbortController (기본 5초)
 * - 4xx/5xx: 상태코드 + 서버 detail 메시지 포함
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    const err = e as Error;
    const aborted = err?.name === 'AbortError';
    throw new ApiError(
      aborted
        ? `요청 시간 초과(${timeoutMs}ms): ${method} ${path}`
        : `네트워크 오류: ${method} ${path} (${err?.message ?? String(e)})`
    );
  } finally {
    clearTimeout(timer);
  }

  let data: unknown = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null; // JSON이 아닌 응답 — 상태코드로만 판단
  }

  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).detail)
        : res.statusText;
    throw new ApiError(`API 오류 ${res.status}: ${method} ${path} — ${detail}`, res.status, data);
  }

  return data as T;
}

export function apiGet<T>(path: string, query?: QueryParams, timeoutMs?: number): Promise<T> {
  return request<T>(path, { method: 'GET', query, timeoutMs });
}

export function apiPost<T>(path: string, body?: unknown, query?: QueryParams): Promise<T> {
  return request<T>(path, { method: 'POST', body, query });
}

export function apiPut<T>(path: string, body?: unknown, query?: QueryParams): Promise<T> {
  return request<T>(path, { method: 'PUT', body, query });
}

export function apiDelete<T>(path: string, query?: QueryParams): Promise<T> {
  return request<T>(path, { method: 'DELETE', query });
}
