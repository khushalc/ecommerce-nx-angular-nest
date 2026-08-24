import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ProductSummary } from '../data/api.types';

interface SeoInput {
  title: string;
  description?: string;
  canonicalPath?: string;      // e.g. '/p/classic-band-22k'
  ogImage?: string;
}

const BRAND = 'e-com-shop';
const PUBLIC_URL = 'http://localhost:4200';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject<Document>(DOCUMENT);

  applyBasic(input: SeoInput) {
    const fullTitle = input.title.includes(BRAND) ? input.title : `${input.title} — ${BRAND}`;
    this.title.setTitle(fullTitle);

    if (input.description) {
      this.meta.updateTag({ name: 'description', content: input.description });
      this.meta.updateTag({ property: 'og:description', content: input.description });
    }
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: BRAND });
    if (input.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: input.ogImage });
    }

    const canonical = `${PUBLIC_URL}${input.canonicalPath ?? ''}`;
    this.setCanonical(canonical);
    this.meta.updateTag({ property: 'og:url', content: canonical });
  }

  applyProduct(product: ProductSummary) {
    const desc = product.description
      ?? `${product.name} — ${product.category.name} at ${BRAND}`;

    this.applyBasic({
      title: product.name,
      description: desc,
      canonicalPath: `/p/${product.slug}`,
      ogImage: product.images[0],
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: desc,
      image: product.images,
      sku: product.sku,
      brand: { '@type': 'Brand', name: BRAND },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: product.price.finalPrice.toFixed(2),
        availability: product.stockDisplay.canAddToCart
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${PUBLIC_URL}/p/${product.slug}`,
      },
    });
  }

  clearJsonLd() {
    this.doc.querySelectorAll('script[data-seo="jsonld"]').forEach((n) => n.remove());
  }

  // ── Internals ──────────────────────────────────────────────────────

  private setCanonical(url: string) {
    let link = this.doc.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: unknown) {
    this.clearJsonLd();
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'jsonld');
    script.text = JSON.stringify(data);
    this.doc.head.appendChild(script);
  }
}
