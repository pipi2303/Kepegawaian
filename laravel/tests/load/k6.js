/**
 * HCMS Load Test — k6
 * Jalankan: k6 run --env BASE_URL=http://localhost:8000 tests/load/k6.js
 *
 * Skenario: 50 VU simulasi staf RS shift pagi login + akses data
 * Threshold: p95 < 500ms, error rate < 1%
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const loginDuration = new Trend('login_duration');
const apiDuration = new Trend('api_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
    stages: [
        { duration: '30s', target: 10 },  // ramp up
        { duration: '1m',  target: 50 },  // peak — 50 staf login bersamaan
        { duration: '30s', target: 0 },   // ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'],  // 95% request < 500ms
        errors:            ['rate<0.01'],  // error < 1%
    },
};

// Ambil CSRF token dari halaman login
function getCsrfToken() {
    const res = http.get(`${BASE_URL}/login`);
    const match = res.body.match(/name="_token"\s+value="([^"]+)"/);
    return match ? match[1] : '';
}

export default function () {
    // 1. Login
    const token = getCsrfToken();
    const loginStart = Date.now();
    const loginRes = http.post(`${BASE_URL}/login`, {
        email: __ENV.TEST_NIP || 'admin@rsudam.test',
        password: __ENV.TEST_PASSWORD || 'password',
        _token: token,
    }, { redirects: 0 });
    loginDuration.add(Date.now() - loginStart);

    const ok = check(loginRes, {
        'login redirect 302': (r) => r.status === 302,
    });
    errorRate.add(!ok);

    if (!ok) return;

    // Cookie sesi dari redirect
    const jar = loginRes.cookies;

    const headers = {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    };

    // 2. Dashboard summary
    const dash = http.get(`${BASE_URL}/api/v1/dashboard/summary`, { headers, jar });
    check(dash, { 'dashboard 200': (r) => r.status === 200 });
    apiDuration.add(dash.timings.duration);

    sleep(1);

    // 3. Daftar pegawai (default per_page=15)
    const list = http.get(`${BASE_URL}/api/v1/pegawai?per_page=15`, { headers, jar });
    check(list, { 'pegawai list 200': (r) => r.status === 200 });
    errorRate.add(list.status !== 200);
    apiDuration.add(list.timings.duration);

    sleep(1);

    // 4. Notifikasi polling (frontend poll setiap 30 detik)
    const notif = http.get(`${BASE_URL}/api/v1/notifications`, { headers, jar });
    check(notif, { 'notifikasi 200': (r) => r.status === 200 });
    apiDuration.add(notif.timings.duration);

    sleep(2);
}

export function handleSummary(data) {
    return {
        'tests/load/results.json': JSON.stringify(data, null, 2),
        stdout: `
=== HCMS Load Test Results ===
VUs Peak    : 50
Req/s Peak  : ${(data.metrics.http_reqs?.values?.rate || 0).toFixed(1)}
p95 Latency : ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms
Error Rate  : ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%
Threshold   : ${data.metrics.http_req_duration?.thresholds ? 'PASS' : 'FAIL'}
`,
    };
}
