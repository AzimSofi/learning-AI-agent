import { DataLoaderService } from './dataLoader';

describe('DataLoaderService', () => {
  let dataLoader: DataLoaderService;

  beforeEach(() => {
    dataLoader = new DataLoaderService();
  });

  test('should load RSS feed', async () => {
    // Mock RSS feed URL (using a real one for integration test)
    const url = 'https://techcrunch.com/feed/';
    const source = 'TechCrunch';

    const articles = await dataLoader.loadFromRSS(url, source);

    expect(articles).toBeDefined();
    expect(Array.isArray(articles)).toBe(true);
    if (articles.length > 0) {
      expect(articles[0]).toHaveProperty('title');
      expect(articles[0]).toHaveProperty('content');
      expect(articles[0]).toHaveProperty('link');
      expect(articles[0]).toHaveProperty('pubDate');
      expect(articles[0]).toHaveProperty('source');
      expect(articles[0].source).toBe(source);
    }
  });

  test('should load multiple RSS feeds', async () => {
    const feeds = [
      { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
    ];

    const articles = await dataLoader.loadMultipleRSS(feeds);

    expect(articles).toBeDefined();
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThan(0);
  });
});