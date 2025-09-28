import { Gemini } from '@llamaindex/google';
import { VectorStoreIndex, Settings, SimpleVectorStore, Document, storageContextFromDefaults } from 'llamaindex';
import { HuggingFaceEmbedding } from '@llamaindex/huggingface';
import { DataLoaderService } from '../services/dataLoader';
import fs from 'fs';

export async function initializeRagSystem() {
  const llm = new Gemini({
    model: "gemini-2.5-flash" as any,
  });
  Settings.llm = llm; // デフォルトはopenAIだから（geminiを使いたい）、設定しないと
  Settings.embedModel = new HuggingFaceEmbedding();

  // シンプルなベクトルストアの初期化・メモリ内にベクトルを保存
  const vectorDbPath = "./data/vectordb";
  if (!fs.existsSync(vectorDbPath)) {
    fs.mkdirSync(vectorDbPath, { recursive: true });
  }
  const vectorStore = new SimpleVectorStore();

  let storageContext;
  let index: VectorStoreIndex;

  try {
    // 既存のベクトルストアをロードしようとする
    storageContext = await storageContextFromDefaults({ persistDir: vectorDbPath });
    index = await VectorStoreIndex.fromVectorStore(vectorStore);
    console.log('Loaded existing RAG system from disk.');
  } catch (error) {
    console.log('No existing RAG system found, creating new one.');
    // 新しく作成
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
    storageContext = await storageContextFromDefaults({ vectorStore, persistDir: vectorDbPath });
    // インデックスを作成
    index = await VectorStoreIndex.fromDocuments(documents, { storageContext });
  }

  return { index, llm };
}
