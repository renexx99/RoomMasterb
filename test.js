import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,          // 50 concurrent users
  duration: '30s',  // 30 detik
};

export default function () {
  const res = http.get('http://localhost:3000/'); // ganti URL kamu

  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  sleep(1);
}