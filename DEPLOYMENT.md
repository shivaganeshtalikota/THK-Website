# Deployment Guide

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

### Option 3: GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json scripts:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

3. Update vite.config.js:
```javascript
export default defineConfig({
  base: '/repository-name/',
  // ... rest of config
})
```

4. Deploy:
```bash
npm run deploy
```

### Option 4: Traditional Hosting (cPanel, etc.)

1. Build the project:
```bash
npm run build
```

2. Upload the `dist` folder contents to your web server

3. Configure your web server to serve index.html for all routes

## 🔧 Environment Variables

Create a `.env` file for production:

```env
VITE_API_URL=your_api_url
VITE_CONTACT_EMAIL=contact@harikrishnatalikota.com
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

## 📊 Performance Optimization

### Before Deployment

1. **Optimize Images**:
   - Use WebP format
   - Compress images
   - Use appropriate sizes

2. **Enable Compression**:
   - Gzip/Brotli compression
   - Minify CSS/JS

3. **CDN Setup**:
   - Use CDN for static assets
   - Enable caching

### After Deployment

1. **Test Performance**:
   - Google PageSpeed Insights
   - GTmetrix
   - WebPageTest

2. **Monitor**:
   - Google Analytics
   - Error tracking (Sentry)
   - Uptime monitoring

## 🔒 Security Checklist

- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] CORS properly set up
- [ ] Rate limiting enabled
- [ ] Input validation on forms
- [ ] XSS protection
- [ ] CSRF protection

## 📱 PWA Configuration

The site is PWA-ready with:
- Service worker (add if needed)
- Web manifest (already included)
- Offline support (optional)

## 🌐 Domain Configuration

### DNS Settings

1. **A Record**:
   - Host: @
   - Points to: Your server IP

2. **CNAME Record**:
   - Host: www
   - Points to: yourdomain.com

3. **SSL Certificate**:
   - Use Let's Encrypt (free)
   - Or your hosting provider's SSL

## 📈 SEO Post-Deployment

1. **Submit Sitemap**:
   - Google Search Console
   - Bing Webmaster Tools

2. **Verify Ownership**:
   - Add verification meta tags
   - Or upload verification files

3. **Monitor**:
   - Search Console
   - Analytics
   - Rankings

## 🔄 Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm install
    
    - name: Build
      run: npm run build
    
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## 🐛 Troubleshooting

### Build Errors

1. Clear cache:
```bash
rm -rf node_modules
rm package-lock.json
npm install
```

2. Check Node version:
```bash
node --version  # Should be 18+
```

### Routing Issues

If routes don't work after deployment:

1. **Vercel**: Add `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

2. **Netlify**: Add `_redirects` in public folder:
```
/*    /index.html   200
```

3. **Apache**: Add `.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 📞 Support

For deployment issues:
- Email: tech@harikrishnatalikota.com
- Documentation: Check README.md
