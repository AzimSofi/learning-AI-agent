import Parser from 'rss-parser';

export interface NewsArticle {
  title: string;
  content: string;
  link: string;
  pubDate: Date;
  source: string;
}

export class DataLoaderService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async loadFromRSS(url: string, source: string): Promise<NewsArticle[]> {
    try {
      const feed = await this.parser.parseURL(url);
      const articles: NewsArticle[] = [];

      for (const item of feed.items || []) {
        if (item.title && item.contentSnippet && item.link && item.pubDate) {
          articles.push({
            title: item.title,
            content: item.contentSnippet,
            link: item.link,
            pubDate: new Date(item.pubDate),
            source: source
          });
        }
      }

      return articles;
    } catch (error) {
      console.error(`Error loading RSS from ${url}:`, error);
      throw error;
    }
  }

  async loadMultipleRSS(feeds: { url: string; source: string }[]): Promise<NewsArticle[]> {
    const allArticles: NewsArticle[] = [];

    for (const feed of feeds) {
      try {
        const articles = await this.loadFromRSS(feed.url, feed.source);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Failed to load from ${feed.source}:`, error);
      }
    }

    // Sort by publication date, newest first
    return allArticles.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  }
}