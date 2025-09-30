import { Gemini, GEMINI_MODEL } from '@llamaindex/google';
import {
  VectorStoreIndex,
  Settings,
  Document,
  storageContextFromDefaults,
} from 'llamaindex';
import { HuggingFaceEmbedding } from '@llamaindex/huggingface';
import { DataLoaderService, NewsArticle } from '../services/dataLoader';
import fs from 'fs';

const vectorDbPath = "./data/vectordb";

export class RAGSystem { 
  // シングルトンパターンを実装しており、RAGSystemクラスのインスタンスを1つだけ作成する
  // なぜstaticが必要、static でなければ、インスタンスが必要になる
  private static instance: RAGSystem; 
  index!: VectorStoreIndex;

  private constructor() { }

  // シングルトンの特徴：
  // シングルトンパターンを実装しており、RAGSystemクラスのインスタンスを1つだけ作成する
  public static async getInstance(): Promise<RAGSystem> {
    if (!RAGSystem.instance) {
      RAGSystem.instance = new RAGSystem();
      await RAGSystem.instance.initialize();
    }
    return RAGSystem.instance;
  }

  private async initialize(): Promise<void> {
    console.log('Initializing RAG system...');
    Settings.llm = new Gemini({ model: GEMINI_MODEL.GEMINI_2_5_FLASH_LITE });
    Settings.embedModel = new HuggingFaceEmbedding();

    if (!fs.existsSync(vectorDbPath)) {
      fs.mkdirSync(vectorDbPath, { recursive: true });
    }

    try {
      const storageContext = await storageContextFromDefaults({ persistDir: vectorDbPath });
      this.index = await VectorStoreIndex.init({ storageContext });
      console.log('Loaded existing RAG system from disk.');
    } catch (error) {
      console.log('No existing RAG system found, creating new one.');
      const dataLoader = new DataLoaderService();
      const feeds = [
        { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
        { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
      ];
      const articles = await dataLoader.loadMultipleRSS(feeds);
      console.log('Articles loaded for initial index:', articles.length);

      const documents = this.createDocuments(articles);
      const storageContext = await storageContextFromDefaults({ persistDir: vectorDbPath });
      this.index = await VectorStoreIndex.fromDocuments(documents, { storageContext }); // storageContext: インデックスのストレージを管理するコンテキスト
      console.log('New RAG system created and saved.');
    }
  }

  private createDocuments(articles: NewsArticle[]): Document[] {
    return articles.map(article =>
      new Document({
        text: `${article.title}\n\n${article.content}`,
        id_: article.link, // Use URL as a unique ID、データの整合性を保つため、データベース内で重複や混乱を防ぎるため
        metadata: {
          title: article.title,
          link: article.link,
          pubDate: article.pubDate?.toISOString(),
          source: article.source,
        },
      })
    );
  }

  public async addArticles(articles: NewsArticle[]): Promise<void> {
    if (!this.index) {
      throw new Error("RAG system is not initialized.");
    }
    console.log(`Adding ${articles.length} new articles to the index...`);
    const documents = this.createDocuments(articles);
    await this.index.insertNodes(documents);
    console.log('Successfully added articles and persisted the index.');
  }

  public async query(queryText: string): Promise<string> {
    if (!this.index) {
      throw new Error("RAG system is not initialized.");
    }
    const queryEngine = this.index.asQueryEngine();
    const response = await queryEngine.query({ query: queryText });
    return response.toString();
  }
}

export const getRagSystem = () => RAGSystem.getInstance();