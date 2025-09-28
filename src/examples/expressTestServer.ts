import express from 'express';
import dotenv from 'dotenv';
import { Gemini } from '@llamaindex/google';
import { VectorStoreIndex } from 'llamaindex';
import { initializeRagSystem } from '../utils/ragSystem';


dotenv.config(); // process.env オブジェクトに環境変数が設定される

const app = express();
const port = process.env.PORT || 3000;

// JSONリクエストボディをパースするためのミドルウェア
app.use(express.json());

// CSPヘッダーを設定（開発環境用）
const cspPolicy = process.env.NODE_ENV === 'production' 
  ? "default-src 'self';" 
  : "default-src 'self'; connect-src 'self' http://localhost:*";

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', cspPolicy);
  next();
});

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

app.get('/', (req, res) => {
  res.status(200).send('RAG System is up and running!');
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
