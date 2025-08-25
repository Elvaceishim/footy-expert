// debug-dns.js
import dns from 'dns';

const hostname = 'db.jqqwztkjsxpggwurunls.supabase.co';

console.log('Testing DNS resolution for:', hostname);

// Try to resolve the hostname
dns.lookup(hostname, (err, address, family) => {
  if (err) {
    console.log('❌ DNS lookup failed:', err);
    return;
  }
  console.log('✅ Resolved to:', address);
  console.log('Address family:', family);
});

// Try with explicit DNS servers
dns.resolve4(hostname, (err, addresses) => {
  if (err) {
    console.log('❌ DNS resolve4 failed:', err);
    return;
  }
  console.log('✅ resolve4 result:', addresses);
});