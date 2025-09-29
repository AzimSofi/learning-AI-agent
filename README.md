# Learning AI agent

RAG（Retrieval-Augmented Generation）とMCP（Model Context Protocol）の学習プロジェクトです。TypeScriptを使用して、データ読み込み、ベクトル化、検索などの基本的なRAG機能と、MCPサーバーの実装を学習することを目的としています。

## 目的

このプロジェクトは、AIエージェントの構築を学ぶためのものです。具体的には：
- RAGシステムを通じて、RSSフィードからニュース記事を読み込み、ベクトル化してクエリベースの検索と生成応答を実現。
- MCPサーバーを実装し、RAGシステムと統合したツール（ファイル一覧、RAGクエリ、RSSデータロード）の提供を学習。
- 両者を統合し、AIモデル（Gemini）とベクトルデータベース（SimpleVectorStore）の操作を習得。

## 機能

- **RAGシステム**:
  - RSSフィード（TechCrunch、The Vergeなど）からのデータ読み込みとパース。
  - 記事のチャンク化とベクトル化（HuggingFaceEmbeddingを使用）。
  - ベクトル検索による関連データ検索とクエリエンジンでの応答生成（Gemini LLMを使用）。
  - シンプルなベクトルストア（SimpleVectorStore）とドキュメント/インデックスストアの管理。
  - Expressサーバー経由のAPIエンドポイント（`/api/query` でクエリ実行、`/health` でヘルスチェック）。
- **MCPサーバー**:
  - `list_files` ツール: 現在のワークスペースのファイル一覧を取得。
  - `query_rag` ツール: RAGシステムにクエリを投げて回答を取得。
  - `load_rss_data` ツール: RSSフィードからデータをロード。
  - Stdioトランスポートを使用したクライアントとの通信。

## 技術スタック

- **言語**: TypeScript
- **テスト**: Jest
- **フレームワーク**: Express
- **RAGライブラリ**: LlamaIndex (@llamaindex/google, @llamaindex/huggingface)
- **AIモデル**: Google Generative AI (@google/generative-ai)
- **MCP**: Model Context Protocol SDK (@modelcontextprotocol/sdk)
- **データ処理**: RSS Parser (rss-parser)
- **ユーティリティ**: Node.js標準ライブラリ, dotenv

## セットアップ

### 前提条件

- Node.js >= 18.0.0
- Google Generative AI APIキー（Geminiモデル使用のため）

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env` ファイルを作成し、以下の変数を設定してください：

```
GOOGLE_API_KEY=your_google_generative_ai_api_key_here
```

### 3. 開発実行

#### RAGシステムのExpressサーバー実行

RAGシステムをAPI経由で利用するためのExpressサーバーを起動します。

```bash
npm run express:test
```
サーバーは `http://localhost:3000` で起動し、以下のエンドポイントを提供します。
- `POST /api/query`: クエリを実行します。
- `GET /health`: ヘルスチェックを行います。

#### MCPテストサーバーの実行

MCP (Model Context Protocol) のテストサーバーを起動する場合：

```bash
npm run mcp:test
```

このコマンドは `src/examples/mcpTestServer.ts` を実行し、2つの数字を足す `add` ツールを提供するテストサーバーを起動します。Stdio経由でMCPクライアントと通信します。

### MCP Inspectorでのテスト

MCPサーバーをテストするには、MCP Inspectorを使用します。Web UIでツールやリソースを操作できます。

1. MCP Inspectorをインストール（ローカル）:
   ```bash
   npm install @modelcontextprotocol/inspector
   ```

2. Inspectorを起動:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

3. ブラウザで開き、以下の設定で接続:
   - **Transport Type**: STDIO
   - **Command**: npx
   - **Arguments**: ts-node src/examples/mcpTestServer.ts

これでツール（`add`）とリソース（`About Azim`）をテストできます。

### Gemini CLIとの連携

Gemini CLIでMCPサーバーを使用するには、まずMCPサーバーをバックグラウンドで起動し、次にGemini CLIでモデルを指定して実行します。

1. MCPサーバーをバックグラウンドで起動：
   ```bash
   npm run mcp:test &
   ```

2. Gemini CLIでモデルを指定して実行：

   - デフォルト：
     ```bash
     gemini
     ```

   - 特定のモデル（例: gemini-2.5-flash）を指定する場合：
     ```bash
     gemini -m "gemini-2.5-flash"
     ```

Gemini CLIがMCPプロトコルをサポートしている場合、起動したサーバーのツール（例: `add`）を利用できます。リソースはGemini CLIでサポートされていないため、Inspectorでテストしてください。

## プロジェクト構造

```
.
├── data/
│   ├── debug/
│   │   └── debug_rss_feed.json
│   └── vectordb/
│       ├── doc_store.json
│       └── index_store.json
├── jest.config.js
├── package.json
├── tsconfig.json
└── src/
    ├── app.ts                 # アプリケーションのエントリーポイント
    ├── examples/
    │   ├── expressTestServer.ts # RAG APIサーバー
    │   └── mcpTestServer.ts     # MCPテストサーバー
    ├── services/
    │   ├── dataLoader.ts        # データロード関連のサービスクラス
    │   ├── dataLoader.test.ts
    │   └── mcpServer.ts         # MCPサーバーの主要ロジック
    └── utils/
        ├── ragSystem.ts
        └── writeTextFileAsync.ts
```

## 学習ポイント

- RAGの基本概念（RSSフィード読み込み、ベクトル化、クエリエンジンでの応答生成）
- ベクトルデータベースの操作（SimpleVectorStoreの初期化と永続化）
- MCPのTypeScriptでの立ち上げ方法（ツールとリソースの登録）
- MCP Inspectorを使用したサーバーテスト
- ExpressサーバーでのAPIエンドポイントの実装
- 環境変数の管理と設定

このプロジェクトでは以下の技術を学ぶことができます：

- **RAG (Retrieval-Augmented Generation)**: ベクトル検索と生成AIの組み合わせ
- **ベクトルデータベース**: テキストのベクトル化と検索
- **MCP (Model Context Protocol)**: TypeScriptでのサーバー立ち上げ方法とInspectorでのテスト
- **AIモデル統合**: Google Geminiの使用と設定

## テスト実行

```bash
npm test
```
