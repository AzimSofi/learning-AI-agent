// src/app.ts
import express from 'express';
import dotenv from 'dotenv';
import { Gemini } from '@llamaindex/google';
import { VectorStoreIndex, Settings, SimpleVectorStore, Document, storageContextFromDefaults } from 'llamaindex';
import { HuggingFaceEmbedding } from '@llamaindex/huggingface';
import { DataLoaderService, NewsArticle } from './services/dataLoader';
import path from 'path';
import fs from 'fs';

// .env ファイルから環境変数をロード
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// JSONリクエストボディをパースするためのミドルウェア
app.use(express.json());

// CSPヘッダーを設定（開発環境用）
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://localhost:*");
  next();
});

// RAGシステムの初期化関数
async function initializeRagSystem() {
  // LLMの設定
  const llm = new Gemini({
    // model: GEMINI_MODEL.GEMINI_PRO,
    model: "gemini-2.5-flash" as any,
  });
  Settings.llm = llm;
  Settings.embedModel = new HuggingFaceEmbedding();

  // シンプルなベクトルストアの初期化
  const vectorStore = new SimpleVectorStore();

  // ニュース記事の読み込み
  const dataLoader = new DataLoaderService();
  const feeds = [
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch' },
    { url: 'https://www.theverge.com/rss/index.xml', source: 'The Verge' },
  ];
  const articles = await dataLoader.loadMultipleRSS(feeds);
  console.log('Articles loaded:', articles.length);

  // 記事をDocumentに変換
  const documents = articles.map(article =>
    new Document({
      text: `${article.title}\n\n${article.content}`,
      metadata: {
        title: article.title,
        link: article.link,
        pubDate: article.pubDate.toISOString(),
        source: article.source,
      },
    })
  );

  // ストレージコンテキストの作成
  const storageContext = await storageContextFromDefaults({ vectorStore });

  // インデックスを作成
  const index = await VectorStoreIndex.fromDocuments(documents, { storageContext });

  return { index, llm };
}

let ragSystem: { index: VectorStoreIndex, llm: Gemini };

// サーバー起動時にRAGシステムを初期化
initializeRagSystem()
  .then(system => {
    ragSystem = system;
    console.log('RAG system initialized.');
    // サーバーをリッスン開始
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize RAG system:', error);
    process.exit(1); // 初期化失敗時は終了
  });


// RAGクエリを処理するAPIエンドポイント
app.post('/api/query', async (req, res) => {
  if (!ragSystem) {
    return res.status(503).json({ error: 'RAG system not initialized yet.' });
  }

  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    // クエリエンジンを作成
    const queryEngine = ragSystem.index.asQueryEngine();

    // クエリを実行
    const response = await queryEngine.query({ query });

    res.json({ answer: response.toString() });
  } catch (error) {
    console.error('Error processing RAG query:', error);
    res.status(500).json({ error: 'Internal server error.', details: (error as Error).message });
  }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', ragSystemInitialized: !!ragSystem });
});
