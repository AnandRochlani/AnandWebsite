# HTTP/2 Setup Guide

HTTP/2 is a major revision of the HTTP protocol that provides significant performance improvements over HTTP/1.1, including:
- **Multiplexing**: Multiple requests over a single connection
- **Server Push**: Proactively send resources to the browser
- **Header Compression**: Reduces overhead
- **Binary Protocol**: More efficient than text-based HTTP/1.1

## Important: HTTP/2 Requires HTTPS

HTTP/2 **requires** HTTPS (SSL/TLS). Most modern hosting providers enable HTTP/2 automatically when you use HTTPS.

## Hosting Provider Setup

### 1. Netlify

**HTTP/2 is automatically enabled** on Netlify for all sites using HTTPS.

✅ **Already Configured**: The `netlify.toml` file in this repository is configured for Netlify deployment.

**To Deploy:**
1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the `netlify.toml` file
3. HTTP/2 will be enabled automatically

**Verify HTTP/2:**
- Use browser DevTools → Network tab → Protocol column
- Or use: https://tools.keycdn.com/http2-test

### 2. Vercel

**HTTP/2 is automatically enabled** on Vercel for all sites using HTTPS.

✅ **Already Configured**: The `vercel.json` file in this repository is configured for Vercel deployment.

**To Deploy:**
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the `vercel.json` file
3. HTTP/2 will be enabled automatically

**Verify HTTP/2:**
- Use browser DevTools → Network tab → Protocol column
- Or use: https://tools.keycdn.com/http2-test

### 3. Hostinger (cPanel/Apache)

**Steps to Enable HTTP/2:**

1. **Enable HTTP/2 in cPanel:**
   - Log in to cPanel
   - Go to "SSL/TLS Status"
   - Ensure SSL certificate is installed and active
   - HTTP/2 should be automatically enabled if your server supports it

2. **If HTTP/2 is not enabled:**
   - Contact Hostinger support to enable HTTP/2 on your server
   - Or upgrade to a plan that supports HTTP/2

3. **Upload `.htaccess` file:**
   - The `.htaccess` file in this repository includes HTTP/2 optimizations
   - Upload it to your public_html directory
   - Ensure mod_http2 is enabled (contact support if needed)

**Verify HTTP/2:**
- Use: https://tools.keycdn.com/http2-test
- Or check browser DevTools → Network → Protocol

### 4. Apache Server (Self-Hosted)

**Steps to Enable HTTP/2:**

1. **Install mod_http2:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install apache2
   sudo a2enmod http2
   sudo systemctl restart apache2
   ```

2. **Update Apache Configuration:**
   ```apache
   # In /etc/apache2/apache2.conf or virtual host config
   LoadModule http2_module modules/mod_http2.so
   Protocols h2 http/1.1
   ```

3. **Update Virtual Host:**
   ```apache
   <VirtualHost *:443>
       ServerName yourdomain.com
       Protocols h2 http/1.1
       # ... rest of config
   </VirtualHost>
   ```

4. **Upload `.htaccess` file:**
   - The `.htaccess` file in this repository is ready to use

### 5. Nginx Server (Self-Hosted)

**Steps to Enable HTTP/2:**

1. **Update Nginx Configuration:**
   - Use the `nginx.conf` file in this repository as a reference
   - Add `http2` to the listen directive:
     ```nginx
     listen 443 ssl http2;
     ```

2. **Ensure SSL is configured:**
   ```nginx
   ssl_certificate /path/to/certificate.crt;
   ssl_certificate_key /path/to/private.key;
   ```

3. **Restart Nginx:**
   ```bash
   sudo nginx -t  # Test configuration
   sudo systemctl restart nginx
   ```

## Verification

### Method 1: Browser DevTools
1. Open your website in Chrome/Firefox
2. Press F12 to open DevTools
3. Go to Network tab
4. Look for "Protocol" column (if not visible, right-click header → Protocol)
5. You should see "h2" for HTTP/2 requests

### Method 2: Online Tools
- **KeyCDN HTTP/2 Test**: https://tools.keycdn.com/http2-test
- **HTTP/2 Check**: https://http2.pro/check
- Enter your domain and check if HTTP/2 is enabled

### Method 3: Command Line
```bash
# Using curl
curl -I --http2 https://yourdomain.com

# Look for "HTTP/2" in the response
```

## Performance Benefits

Once HTTP/2 is enabled, you should see:
- **Faster page loads** (especially on mobile)
- **Reduced latency** (multiplexing allows parallel requests)
- **Better resource loading** (server push can preload critical resources)
- **Improved PageSpeed Insights scores**

## Troubleshooting

### HTTP/2 Not Working?

1. **Check SSL Certificate:**
   - HTTP/2 requires a valid SSL certificate
   - Ensure your site uses HTTPS (not HTTP)

2. **Check Server Support:**
   - Contact your hosting provider to confirm HTTP/2 support
   - Some shared hosting plans may not support HTTP/2

3. **Check Browser Support:**
   - Modern browsers (Chrome, Firefox, Safari, Edge) all support HTTP/2
   - Older browsers may fall back to HTTP/1.1

4. **Clear Browser Cache:**
   - Sometimes browsers cache the protocol
   - Try incognito/private mode

### Hostinger Specific

If you're using Hostinger and HTTP/2 is not enabled:

1. **Check Your Plan:**
   - Some Hostinger plans may not include HTTP/2
   - Consider upgrading to a plan that supports it

2. **Contact Support:**
   - Ask Hostinger support to enable HTTP/2 on your account
   - Provide them with your domain name

3. **Alternative:**
   - Use Cloudflare (free) as a CDN/proxy
   - Cloudflare automatically enables HTTP/2
   - Point your domain to Cloudflare nameservers

## Cloudflare (Free Alternative)

If your hosting provider doesn't support HTTP/2, you can use Cloudflare:

1. Sign up for free Cloudflare account
2. Add your domain
3. Update nameservers at your domain registrar
4. Cloudflare automatically enables HTTP/2 and HTTPS
5. **Bonus**: Also get DDoS protection, CDN, and other optimizations

## Files in This Repository

- **`netlify.toml`**: Configuration for Netlify hosting
- **`vercel.json`**: Configuration for Vercel hosting
- **`.htaccess`**: Configuration for Apache/cPanel hosting
- **`nginx.conf`**: Configuration for Nginx servers

## Next Steps

1. **Choose your hosting provider** from the list above
2. **Follow the specific setup instructions** for your provider
3. **Verify HTTP/2 is enabled** using the verification methods
4. **Test performance** with PageSpeed Insights
5. **Monitor improvements** in Core Web Vitals

## Additional Resources

- [HTTP/2 Specification](https://http2.github.io/)
- [Can I Use HTTP/2](https://caniuse.com/http2)
- [HTTP/2 Performance](https://www.cloudflare.com/learning/performance/what-is-http2/)
