/**
 * Aura Jewelry — Dynamic Multi-Pixel Tracking Engine
 * Supports: Meta (Facebook) Pixel, TikTok Pixel, Google Analytics 4 (GA4), Snapchat Pixel
 */

class PixelTracker {
  constructor() {
    this.config = {
      metaPixelId: '',
      metaPixelEnabled: false,
      tiktokPixelId: '',
      tiktokPixelEnabled: false,
      googleAnalyticsId: '',
      googleAnalyticsEnabled: false,
      snapchatPixelId: '',
      snapchatPixelEnabled: false
    };
    this.initialized = false;
  }

  init(config) {
    if (!config) return;
    this.config = { ...this.config, ...config };

    // 1. Initialize Meta (Facebook) Pixel
    if (this.config.metaPixelEnabled && this.config.metaPixelId) {
      try {
        if (window.fbq) {
          const pixelId = this.config.metaPixelId.trim();
          // Disable automatic button click scraping (prevents admin tabs/buttons from firing fake events)
          window.fbq('set', 'autoConfig', false, pixelId);
          window.fbq('init', pixelId);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin')) {
            window.fbq('track', 'PageView');
          }
          console.log(`[PixelTracker] Meta Pixel initialized: ${pixelId}`);
        }
      } catch (e) {
        console.error('[PixelTracker] Failed to init Meta Pixel:', e);
      }
    }

    // 2. Initialize TikTok Pixel
    if (this.config.tiktokPixelEnabled && this.config.tiktokPixelId && !window.ttq) {
      try {
        (function(w, d, t) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
          ttq.setAndDefer = function(t, e) {
            t[e] = function() {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function(t) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function(e, n) {
            var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            (ttq._i = ttq._i || {}), (ttq._i[e] = []), (ttq._i[e]._u = i), (ttq._t = ttq._t || {}), (ttq._t[e] = +new Date()), (ttq._o = ttq._o || {}), (ttq._o[e] = n || {});
            var o = document.createElement('script');
            (o.type = 'text/javascript'), (o.async = !0), (o.src = i + '?sdkid=' + e + '&lib=' + t);
            var a = document.getElementsByTagName('script')[0];
            a.parentNode.insertBefore(o, a);
          };
          ttq.load(config.tiktokPixelId.trim());
          ttq.page();
        })(window, document, 'ttq');
        console.log(`[PixelTracker] TikTok Pixel initialized: ${this.config.tiktokPixelId}`);
      } catch (e) {
        console.error('[PixelTracker] Failed to init TikTok Pixel:', e);
      }
    }

    // 3. Initialize Google Analytics 4 (GA4 / GTM)
    if (this.config.googleAnalyticsEnabled && this.config.googleAnalyticsId && !window.gtag) {
      try {
        const gaId = this.config.googleAnalyticsId.trim();
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', gaId);
        console.log(`[PixelTracker] Google Analytics initialized: ${gaId}`);
      } catch (e) {
        console.error('[PixelTracker] Failed to init GA4:', e);
      }
    }

    // 4. Initialize Snapchat Pixel
    if (this.config.snapchatPixelEnabled && this.config.snapchatPixelId && !window.snaptr) {
      try {
        (function(e, t, n) {
          if (e.snaptr) return;
          var a = (e.snaptr = function() {
            a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
          });
          a.queue = [];
          var s = 'script';
          var r = t.createElement(s);
          r.async = !0;
          r.src = n;
          var u = t.getElementsByTagName(s)[0];
          u.parentNode.insertBefore(r, u);
        })(window, document, 'https://sc-static.net/scevent.min.js');

        window.snaptr('init', this.config.snapchatPixelId.trim());
        window.snaptr('track', 'PAGE_VIEW');
        console.log(`[PixelTracker] Snapchat Pixel initialized: ${this.config.snapchatPixelId}`);
      } catch (e) {
        console.error('[PixelTracker] Failed to init Snapchat Pixel:', e);
      }
    }

    this.initialized = true;
  }

  // --- STANDARD E-COMMERCE EVENTS ---

  /**
   * Track Page View
   */
  trackPageView(pageName = 'Aura Store') {
    // Exclude internal admin dashboard views to prevent skewing store analytics
    if (
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) ||
      (pageName && pageName.toLowerCase().includes('admin'))
    ) {
      return;
    }

    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'PageView');
    }
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.page();
    }
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'page_view', { page_title: pageName });
    }
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'PAGE_VIEW');
    }
  }

  /**
   * Track Product View (ViewContent)
   */
  trackViewContent(product) {
    if (!product) return;
    const price = parseFloat(product.priceStr || product.price) || 0;
    const currency = 'MAD';
    const contentId = String(product.id);
    const contentName = product.name || 'Jewelry Piece';
    const category = product.category || 'Jewelry';

    // Meta Pixel
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: contentName,
        content_category: category,
        content_ids: [contentId],
        content_type: 'product',
        value: price,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('ViewContent', {
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
        quantity: 1,
        price: price,
        value: price,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: currency,
        value: price,
        items: [{
          item_id: contentId,
          item_name: contentName,
          item_category: category,
          price: price,
          quantity: 1
        }]
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'VIEW_CONTENT', {
        item_category: category,
        item_ids: [contentId],
        price: price,
        currency: currency
      });
    }
  }

  /**
   * Track Add To Bag (AddToCart)
   */
  trackAddToCart(product, size = 'Standard', quantity = 1) {
    if (!product) return;
    const price = parseFloat(product.priceStr || product.price) || 0;
    const totalValue = price * quantity;
    const currency = 'MAD';
    const contentId = String(product.id);
    const contentName = product.name || 'Jewelry Piece';
    const category = product.category || 'Jewelry';

    // Meta Pixel
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: contentName,
        content_category: category,
        content_ids: [contentId],
        content_type: 'product',
        value: totalValue,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
        quantity: quantity,
        price: price,
        value: totalValue,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: currency,
        value: totalValue,
        items: [{
          item_id: contentId,
          item_name: contentName,
          item_category: category,
          item_variant: size,
          price: price,
          quantity: quantity
        }]
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'ADD_CART', {
        item_category: category,
        item_ids: [contentId],
        number_items: quantity,
        price: totalValue,
        currency: currency
      });
    }
  }

  /**
   * Track when a customer selects an individual piece inside the Bundle Builder
   */
  trackBundleItemSelect(product) {
    if (!product) return;
    const price = parseFloat(product.priceStr || product.price) || 0;
    const currency = 'MAD';
    const contentId = String(product.id);
    const contentName = product.name || 'Jewelry Piece';
    const category = product.category || 'Jewelry';

    // Meta Pixel (tracks standard AddToCart and CustomizeProduct)
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: contentName,
        content_category: category,
        content_ids: [contentId],
        content_type: 'product',
        value: price,
        currency: currency
      });
      window.fbq('track', 'CustomizeProduct', {
        content_name: contentName,
        content_category: category,
        content_ids: [contentId],
        content_type: 'product',
        value: price,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('AddToCart', {
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
        quantity: 1,
        price: price,
        value: price,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: currency,
        value: price,
        items: [{
          item_id: contentId,
          item_name: contentName,
          item_category: category,
          price: price,
          quantity: 1
        }]
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'ADD_CART', {
        item_category: category,
        item_ids: [contentId],
        number_items: 1,
        price: price,
        currency: currency
      });
    }
  }

  /**
   * Track when a customer adds the full completed bundle to cart
   */
  trackBundleAddToCart(items = [], totalValue = 0) {
    if (!items || items.length === 0) return;
    const currency = 'MAD';
    const contentIds = items.map(item => String(item.id));
    const totalQty = items.length;
    const value = parseFloat(totalValue) || items.reduce((s, i) => s + (parseFloat(i.priceStr || i.price) || 0), 0);

    // Meta Pixel
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: `Custom Jewelry Bundle (${totalQty} Pieces)`,
        content_category: 'Jewelry Bundle',
        content_ids: contentIds,
        content_type: 'product_group',
        num_items: totalQty,
        value: value,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('AddToCart', {
        content_type: 'product',
        quantity: totalQty,
        value: value,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: currency,
        value: value,
        items: items.map(i => ({
          item_id: String(i.id),
          item_name: i.name,
          item_category: i.category || 'Jewelry',
          price: parseFloat(i.priceStr || i.price) || 0,
          quantity: 1
        }))
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'ADD_CART', {
        item_ids: contentIds,
        number_items: totalQty,
        price: value,
        currency: currency
      });
    }
  }

  /**
   * Track Initiate Checkout
   */
  trackInitiateCheckout(items = [], cartTotal = 0) {
    const totalValue = parseFloat(cartTotal) || 0;
    const currency = 'MAD';
    const contentIds = items.map(item => String(item.id));
    const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);

    // Meta Pixel
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_ids: contentIds,
        content_type: 'product',
        num_items: totalQty,
        value: totalValue,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('InitiateCheckout', {
        contents: items.map(i => ({
          content_id: String(i.id),
          content_name: i.name,
          quantity: i.quantity || 1,
          price: parseFloat(i.priceStr || i.price) || 0
        })),
        value: totalValue,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: currency,
        value: totalValue,
        items: items.map(i => ({
          item_id: String(i.id),
          item_name: i.name,
          price: parseFloat(i.priceStr || i.price) || 0,
          quantity: i.quantity || 1
        }))
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'START_CHECKOUT', {
        item_ids: contentIds,
        number_items: totalQty,
        price: totalValue,
        currency: currency
      });
    }
  }

  /**
   * Track Successful Purchase
   */
  trackPurchase(orderId, cartTotal, items = []) {
    const totalValue = parseFloat(cartTotal) || 0;
    const currency = 'MAD';
    const contentIds = items.map(item => String(item.id));
    const totalQty = items.reduce((s, i) => s + (i.quantity || 1), 0);

    // Meta Pixel
    if (this.config.metaPixelEnabled && window.fbq) {
      window.fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_type: 'product',
        num_items: totalQty,
        value: totalValue,
        currency: currency
      });
    }

    // TikTok Pixel
    if (this.config.tiktokPixelEnabled && window.ttq) {
      window.ttq.track('CompletePayment', {
        content_id: String(orderId),
        contents: items.map(i => ({
          content_id: String(i.id),
          content_name: i.name,
          quantity: i.quantity || 1,
          price: parseFloat(i.priceStr || i.price) || 0
        })),
        value: totalValue,
        currency: currency
      });
    }

    // Google Analytics
    if (this.config.googleAnalyticsEnabled && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: String(orderId),
        value: totalValue,
        currency: currency,
        items: items.map(i => ({
          item_id: String(i.id),
          item_name: i.name,
          price: parseFloat(i.priceStr || i.price) || 0,
          quantity: i.quantity || 1
        }))
      });
    }

    // Snapchat Pixel
    if (this.config.snapchatPixelEnabled && window.snaptr) {
      window.snaptr('track', 'PURCHASE', {
        transaction_id: String(orderId),
        item_ids: contentIds,
        number_items: totalQty,
        price: totalValue,
        currency: currency
      });
    }

    console.log(`[PixelTracker] Tracked Purchase for Order #${orderId} — Total: ${totalValue} MAD`);
  }

  /**
   * Health Test Ping
   */
  testPing() {
    const results = {
      meta: Boolean(this.config.metaPixelEnabled && this.config.metaPixelId && window.fbq),
      tiktok: Boolean(this.config.tiktokPixelEnabled && this.config.tiktokPixelId && window.ttq),
      google: Boolean(this.config.googleAnalyticsEnabled && this.config.googleAnalyticsId && window.gtag),
      snapchat: Boolean(this.config.snapchatPixelEnabled && this.config.snapchatPixelId && window.snaptr)
    };

    if (results.meta) window.fbq('trackCustom', 'AuraAdminTestPing', { time: new Date().toISOString() });
    if (results.tiktok) window.ttq.track('AuraAdminTestPing', { time: new Date().toISOString() });
    if (results.google) window.gtag('event', 'aura_admin_test_ping', { time: new Date().toISOString() });
    if (results.snapchat) window.snaptr('track', 'CUSTOM_EVENT_1', { label: 'AuraAdminTestPing' });

    return results;
  }
}

export const pixelTracker = new PixelTracker();
export default pixelTracker;
