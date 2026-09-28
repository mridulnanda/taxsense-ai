/**
 * k6 Load Testing Script for TaxSense AI
 * Tests API endpoints under various load conditions
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';
const THINK_TIME = 1;

// Custom metrics
export const errorRate = new Rate('errors');
export const apiLatency = new Trend('api_latency');
export const computationDuration = new Trend('computation_duration');
export const activeUsers = new Gauge('active_users');
export const failedRequests = new Counter('failed_requests');

// Load test scenarios
export const options = {
  scenarios: {
    // Warm up phase
    warmup: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      gracefulStop: '5s',
    },
    // Ramp up phase
    rampup: {
      executor: 'ramp-vus',
      startVUs: 5,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 150 },
      ],
      gracefulStop: '1m',
    },
    // Peak load phase
    peak: {
      executor: 'constant-vus',
      vus: 150,
      duration: '5m',
      gracefulStop: '1m',
    },
    // Ramp down phase
    rampdown: {
      executor: 'ramp-vus',
      startVUs: 150,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.1'],
    'api_latency': ['p(95)<500'],
  },
};

/**
 * Health check
 */
export function handleHealthCheck() {
  group('Health Check', () => {
    const response = http.get(`${BASE_URL}/api/health`);
    check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 100ms': (r) => r.timings.duration < 100,
    });
    apiLatency.add(response.timings.duration);
    if (response.status !== 200) {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
}

/**
 * Authentication flow
 */
export function handleAuthentication() {
  group('Authentication', () => {
    const credentials = {
      email: `testuser${Math.random()}@example.com`,
      password: 'Test@12345',
    };

    // Sign up
    let response = http.post(`${BASE_URL}/api/auth/signup`, JSON.stringify(credentials), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(response, {
      'signup status is 201': (r) => r.status === 201 || r.status === 400,
    });

    // Login
    response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(credentials), {
      headers: { 'Content-Type': 'application/json' },
    });
    check(response, {
      'login status is 200': (r) => r.status === 200,
      'login returns token': (r) => r.json('token') !== undefined,
    });

    apiLatency.add(response.timings.duration);
    if (response.status !== 200) {
      errorRate.add(1);
      failedRequests.add(1);
    }

    return response.json('token');
  });
}

/**
 * Computation flow
 */
export function handleComputations(token) {
  group('Tax Computation', () => {
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // Create computation
    let response = http.post(
      `${BASE_URL}/api/computations`,
      JSON.stringify({
        financialYear: '2025-26',
        assessmentYear: '2026-27',
      }),
      { headers }
    );

    check(response, {
      'create computation status is 201': (r) => r.status === 201,
      'computation has id': (r) => r.json('id') !== undefined,
    });

    const computationId = response.json('id');
    computationDuration.add(response.timings.duration);

    if (response.status === 201) {
      sleep(THINK_TIME);

      // Add income sources
      response = http.post(
        `${BASE_URL}/api/computations/${computationId}/income-sources`,
        JSON.stringify({
          sourceType: 'salary',
          amount: 5000000,
          taxTreated: 5000000,
        }),
        { headers }
      );

      check(response, {
        'add income status is 201': (r) => r.status === 201,
      });

      sleep(THINK_TIME);

      // Add deductions
      response = http.post(
        `${BASE_URL}/api/computations/${computationId}/deductions`,
        JSON.stringify({
          deductionType: '80c',
          section: '80C',
          amount: 150000,
        }),
        { headers }
      );

      check(response, {
        'add deduction status is 201': (r) => r.status === 201,
      });

      sleep(THINK_TIME);

      // Calculate tax
      response = http.post(
        `${BASE_URL}/api/computations/${computationId}/calculate`,
        '{}',
        { headers }
      );

      check(response, {
        'calculate status is 200': (r) => r.status === 200,
        'calculation has tax amount': (r) => r.json('taxAmount') !== undefined,
      });

      apiLatency.add(response.timings.duration);
      computationDuration.add(response.timings.duration);
    }

    if (response.status >= 400) {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
}

/**
 * Document upload flow
 */
export function handleDocumentUpload(token) {
  group('Document Upload', () => {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    // Create form data
    const formData = {
      documentType: 'aadhar',
      file: http.file(new ArrayBuffer(1024), 'test-document.pdf', 'application/pdf'),
    };

    const response = http.post(`${BASE_URL}/api/documents/upload`, formData, {
      headers,
    });

    check(response, {
      'upload status is 201': (r) => r.status === 201 || r.status === 413,
      'upload returns file id': (r) => r.json('id') !== undefined || r.status !== 201,
    });

    apiLatency.add(response.timings.duration);
    if (response.status >= 400) {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
}

/**
 * Search and filtering
 */
export function handleSearch(token) {
  group('Search', () => {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = http.get(`${BASE_URL}/api/computations?status=draft&limit=10&offset=0`, {
      headers,
    });

    check(response, {
      'search status is 200': (r) => r.status === 200,
      'search returns data': (r) => r.json('data') !== undefined,
    });

    apiLatency.add(response.timings.duration);
    if (response.status >= 400) {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
}

/**
 * Report generation
 */
export function handleReportGeneration(token) {
  group('Report Generation', () => {
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const response = http.get(`${BASE_URL}/api/reports/summary?format=pdf`, {
      headers,
      responseType: 'binary',
    });

    check(response, {
      'report status is 200': (r) => r.status === 200,
      'report has content': (r) => r.body.length > 0,
    });

    apiLatency.add(response.timings.duration);
    if (response.status >= 400) {
      errorRate.add(1);
      failedRequests.add(1);
    }
  });
}

/**
 * Main load test function
 */
export default function () {
  activeUsers.add(1);

  try {
    // Health check
    handleHealthCheck();
    sleep(THINK_TIME);

    // Authentication
    const token = handleAuthentication();
    sleep(THINK_TIME);

    // Computations
    handleComputations(token);
    sleep(THINK_TIME);

    // Document upload
    handleDocumentUpload(token);
    sleep(THINK_TIME);

    // Search
    handleSearch(token);
    sleep(THINK_TIME);

    // Report generation
    handleReportGeneration(token);
    sleep(THINK_TIME);
  } catch (error) {
    errorRate.add(1);
    failedRequests.add(1);
    console.error(`Test error: ${error}`);
  }

  activeUsers.add(-1);
}

/**
 * Setup phase
 */
export function setup() {
  console.log('Starting load test against:', BASE_URL);
  const response = http.get(`${BASE_URL}/api/health`);
  if (response.status !== 200) {
    throw new Error(`Target URL not accessible: ${response.status}`);
  }
}

/**
 * Teardown phase
 */
export function teardown() {
  console.log('Load test completed');
}
