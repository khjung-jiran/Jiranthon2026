/**
 * 자체서명 인증서로 HTTPS 프록시를 띄워 Expo 웹 서버를 HTTPS로 노출.
 * 의존성 없이 Node.js 내장 crypto만으로 인증서 생성.
 * 사용: node https-proxy.js [target_port] [proxy_port]
 * 기본: target=8082, proxy=8443
 */
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TARGET_PORT = parseInt(process.argv[2] || '8082', 10);
const PROXY_PORT = parseInt(process.argv[3] || '8443', 10);
const STRIP_ORIGIN = process.argv.includes('--strip-origin'); // Expo 프록시만 Origin 제거

// ── ASN.1 DER 인코딩 헬퍼 ──
function derLength(len) {
  if (len < 0x80) return [len];
  if (len < 0x100) return [0x81, len];
  return [0x82, (len >> 8) & 0xff, len & 0xff];
}
function derTag(tag, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return Buffer.concat([Buffer.from([tag, ...derLength(buf.length)]), buf]);
}
function derSequence(content) {
  const items = Array.isArray(content) ? content : [content];
  const buf = Buffer.concat(items.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c)));
  return derTag(0x30, buf);
}
function derSet(content) {
  const items = Array.isArray(content) ? content : [content];
  const buf = Buffer.concat(items.map(c => Buffer.isBuffer(c) ? c : Buffer.from(c)));
  return derTag(0x31, buf);
}
function derInteger(val) {
  if (val < 0x80) return derTag(0x02, Buffer.from([val]));
  if (val < 0x8000) return derTag(0x02, Buffer.from([(val >> 8) & 0xff, val & 0xff]));
  const buf = Buffer.alloc(4);
  buf.writeInt32BE(val);
  return derTag(0x02, buf);
}
function derBitString(content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return derTag(0x03, Buffer.concat([Buffer.from([0x00]), buf]));
}
function derOid(oidStr) {
  const parts = oidStr.split('.').map(Number);
  const bytes = [40 * parts[0] + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    let v = parts[i];
    if (v < 0x80) { bytes.push(v); continue; }
    const stack = [];
    stack.push(v & 0x7f); v >>= 7;
    while (v > 0) { stack.push(0x80 | (v & 0x7f)); v >>= 7; }
    bytes.push(...stack.reverse());
  }
  return derTag(0x06, Buffer.from(bytes));
}
function derUtf8String(str) { return derTag(0x0C, Buffer.from(str, 'utf8')); }
function derUTCTime(d) {
  const yy = String(d.getUTCFullYear() % 100).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return derTag(0x17, Buffer.from(`${yy}${mm}${dd}${hh}${mi}${ss}Z`, 'ascii'));
}

// ── 자체서명 인증서 생성 (의존성 없이) ──
function generateCert() {
  const certDir = path.join(__dirname, '.certs');
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
  const keyPath = path.join(certDir, 'key.pem');
  const certPath = path.join(certDir, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    console.log('기존 인증서 재사용');
    return { key: fs.readFileSync(keyPath, 'utf8'), cert: fs.readFileSync(certPath, 'utf8') };
  }

  // openssl 시도
  try {
    require('child_process').execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost" -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"`,
      { stdio: 'pipe', timeout: 5000 }
    );
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      console.log('openssl로 인증서 생성');
      return { key: fs.readFileSync(keyPath, 'utf8'), cert: fs.readFileSync(certPath, 'utf8') };
    }
  } catch { /* fall through to manual */ }

  // 수동 생성: RSA 키 + X.509 DER 직접 빌드
  console.log('Node crypto로 인증서 생성 중...');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const privKeyObj = crypto.createPrivateKey(privateKey);
  const subject = derSequence(derSet(derSequence(derOid('2.5.4.3'), derUtf8String('localhost'))));
  const now = new Date();
  const later = new Date(now.getTime() + 365 * 86400000);
  const validity = derSequence(derUTCTime(now), derUTCTime(later));

  // SubjectAltName extension
  const sanExt = derSequence(
    derOid('2.5.29.17'),
    Buffer.from(derTag(0x04, derSequence(
      Buffer.from([0x82, 0x09].concat(Buffer.from('localhost')))
    ))),
  );
  const exts = derTag(0xA3, derSequence(sanExt));

  const tbs = derSequence(
    derTag(0xA0, derInteger(2)),  // [0] EXPLICIT version v3
    derInteger(1),                // serialNumber
    derSequence(derOid('1.2.840.113549.1.1.11')),  // signatureAlgorithm
    subject,                      // issuer
    validity,                     // validity
    subject,                      // subject
    publicKey,                    // subjectPublicKeyInfo (already SPKI DER)
  );

  const sign = crypto.createSign('SHA256');
  sign.update(Buffer.from(tbs));
  const signature = sign.sign(privKeyObj);

  const certDer = derSequence(
    tbs,
    derSequence(derOid('1.2.840.113549.1.1.11')),
    derBitString(signature)
  );
  const certPem = '-----BEGIN CERTIFICATE-----\n' +
    Buffer.from(certDer).toString('base64').match(/.{1,64}/g).join('\n') +
    '\n-----END CERTIFICATE-----\n';

  fs.writeFileSync(keyPath, privateKey);
  fs.writeFileSync(certPath, certPem);
  console.log('인증서 생성 완료');
  return { key: privateKey, cert: certPem };
}

// ── HTTPS 프록시 서버 ──
const certs = generateCert();

const server = https.createServer(certs, (req, res) => {
  const headers = STRIP_ORIGIN
    ? (() => { const { origin, referer, ...h } = req.headers; return h; })()
    : req.headers;
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: { ...headers, host: `127.0.0.1:${TARGET_PORT}` },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on('error', (e) => { res.writeHead(502); res.end(`Proxy error: ${e.message}`); });
  req.pipe(proxyReq, { end: true });
});

// WebSocket 프록시 (HMR)
server.on('upgrade', (req, socket, head) => {
  const headers = STRIP_ORIGIN
    ? (() => { const { origin, referer, ...h } = req.headers; return h; })()
    : req.headers;
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: 'GET',
    headers: { ...headers, host: `127.0.0.1:${TARGET_PORT}` },
  });
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(
      `HTTP/1.1 101 Switching Protocols\r\n` +
      Object.entries(proxyRes.headers).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
      '\r\n\r\n'
    );
    if (proxyHead.length) socket.write(proxyHead);
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });
  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

const nets = os.networkInterfaces();
const lanIP = Object.values(nets).flat().find((i) => i?.family === 'IPv4' && !i?.internal)?.address;

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`\n  HTTPS 프록시 실행 중`);
  console.log(`  로컬:  https://localhost:${PROXY_PORT}`);
  if (lanIP) console.log(`  외부:  https://${lanIP}:${PROXY_PORT}`);
  console.log(`  포워딩: http://127.0.0.1:${TARGET_PORT}`);
  console.log(`\n  브라우저 인증서 경고 -> "고급" -> "계속 진행" 클릭\n`);
});
