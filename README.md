# RAG News Summarization Agent

TypeScriptで実装されたRAG（Retrieval-Augmented Generation）ベースのニュース記事要約エージェントです。LlamaIndexとGemini AIを使用して、ニュース記事をベクトル化し、ユーザーのクエリに対して関連記事を検索・要約します。

## 機能

- RSSフィードからのニュース記事自動読み込み
- 記事のチャンク化とベクトル化
- ベクトル検索による関連記事検索
- Gemini AIによる要約生成
- REST APIエンドポイント

## 技術スタック

- **言語**: TypeScript
- **フレームワーク**: Express.js
- **RAGライブラリ**: LlamaIndex
- **LLM**: Google Gemini (gemini-2.5-flash)
- **埋め込みモデル**: HuggingFace Embedding
- **ベクトルストア**: SimpleVectorStore (LlamaIndex)
- **データソース**: RSSフィード (TechCrunch, The Verge)

## セットアップ

### 前提条件

- Node.js >= 18.0.0

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定してください：

```env
GOOGLE_API_KEY=your_google_api_key_here
PORT=3000
```

### 3. ビルド

```bash
npm run build
```

### 4. 実行

```bash
npm start
```

開発モードで実行する場合：

```bash
npm run dev
```

### テスト実行

```bash
npm test
```

## API使用方法

### ヘルスチェック

```bash
GET /health
```

### クエリ実行

```bash
POST /api/query
Content-Type: application/json

{
  "query": "今日のAIに関する最新ニュースを3つ教えて、要約して"
}
```

## プロジェクト構造

```
jest.config.js          # Jestテスト設定
package.json            # プロジェクト設定と依存関係
tsconfig.json           # TypeScript設定
src/
├── app.ts              # メインアプリケーションとAPIエンドポイント
└── services/
    ├── dataLoader.ts   # RSSデータ読み込みサービス
    └── dataLoader.test.ts  # テストファイル
```

## 学習ポイント

このプロジェクトでは以下の技術を学ぶことができます：

- **RAG (Retrieval-Augmented Generation)**: ベクトル検索と生成AIの組み合わせ
- **ベクトルデータベース**: テキストのベクトル化と検索
- **プロンプトエンジニアリング**: LLMとの効果的な対話
- **API設計**: RESTful APIの設計と実装
- **TypeScript**: 型安全なJavaScript開発
- **テスト**: Jestを使用したユニットテスト

## テスト実行

```bash
npm test
```
