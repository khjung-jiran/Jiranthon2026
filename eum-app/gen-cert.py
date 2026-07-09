"""자체서명 인증서 생성 (의존성 없이 Python ssl/cryptography 사용)"""
import os
import sys
import datetime

cert_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.certs')
os.makedirs(cert_dir, exist_ok=True)
key_path = os.path.join(cert_dir, 'key.pem')
cert_path = os.path.join(cert_dir, 'cert.pem')

if os.path.exists(key_path) and os.path.exists(cert_path):
    print('기존 인증서 재사용')
    sys.exit(0)

try:
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
except ImportError:
    print('cryptography 패키지 없음 — openssl 시도')
    import subprocess
    subprocess.run([
        'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
        '-keyout', key_path, '-out', cert_path,
        '-days', '365', '-nodes', '-subj', '/CN=localhost',
        '-addext', 'subjectAltName=IP:127.0.0.1,DNS:localhost'
    ], check=True)
    print('openssl로 인증서 생성 완료')
    sys.exit(0)

key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
subject = issuer = x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'localhost')])
cert = (
    x509.CertificateBuilder()
    .subject_name(subject)
    .issuer_name(issuer)
    .public_key(key.public_key())
    .serial_number(x509.random_serial_number())
    .not_valid_before(datetime.datetime.utcnow())
    .not_valid_after(datetime.datetime.utcnow() + datetime.timedelta(days=365))
    .add_extension(
        x509.SubjectAlternativeName([x509.DNSName('localhost'), x509.IPAddress(__import__('ipaddress').ip_address('127.0.0.1'))]),
        critical=False,
    )
    .sign(key, hashes.SHA256())
)

with open(key_path, 'wb') as f:
    f.write(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ))
with open(cert_path, 'wb') as f:
    f.write(cert.public_bytes(serialization.Encoding.PEM))

print('인증서 생성 완료')
