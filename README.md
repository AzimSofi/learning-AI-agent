# Learning AI agent

RAG（Retrieval-Augmented Generation）とMCP（Model Context Protocol）の学習プロジェクトです。TypeScriptを使用して、データ読み込み、ベクトル化、検索などの基本的なRAG機能と、MCPサーバーの実装を学習することを目的としています。

## 機能

- RSSフィードからのデータ読み込み
- 記事のチャンク化とベクトル化
- ベクトル検索による関連データ検索
- シンプルなデータストアとインデックスストア

## 技術スタック

- **言語**: TypeScript
- **テスト**: Jest
- **フレームワーク**: Express
- **RAGライブラリ**: LlamaIndex (@llamaindex/google, @llamaindex/huggingface)
- **AIモデル**: Google Generative AI (@google/generative-ai)
- **MCP**: Model Context Protocol SDK (@modelcontextprotocol/sdk)
- **データ処理**: RSS Parser (rss-parser), CSV Parse/Stringify
- **ユーティリティ**: Node.js標準ライブラリ, dotenv

## セットアップ

### 前提条件

- Node.js >= 18.0.0

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 開発実行

```bash
npm run dev
```

### 3. MCPテストサーバーの実行

MCP (Model Context Protocol) のテストサーバーを起動する場合：

```bash
npm run mcp-test-server
```

このコマンドは `mcp-server/mcpTestServer.ts` を実行し、2つの数字を足す `add` ツールを提供するテストサーバーを起動します。Stdio経由でMCPクライアントと通信します。

#### Gemini CLIとの連携

Gemini CLIでMCPサーバーを使用するには、まずMCPサーバーをバックグラウンドで起動し、次にGemini CLIでモデルを指定して実行します。

1. MCPサーバーをバックグラウンドで起動：
   ```bash
   npm run mcp-test-server &
   ```

2. Gemini CLIでモデルを指定して実行：
   ```bash
   gemini -m "gemini-2.5-flash"
   ```

Gemini CLIがMCPプロトコルをサポートしている場合、起動したサーバーのツール（例: `add`）を利用できます。

## プロジェクト構造

```
jest.config.js          # Jestテスト設定
package.json            # プロジェクト設定と依存関係
tsconfig.json           # TypeScript設定
data/
├── debug/
│   └── debug_rss_feed.json  # デバッグ用RSSフィードデータ
└── vectordb/
    ├── doc_store.json       # ドキュメントストア
    └── index_store.json     # インデックスストア
mcp-server/
    └── mcpTestServer.ts  # MCPテストサーバー
src/
├── app.ts              # メインアプリケーション
├── services/
│   ├── dataLoader.ts   # データ読み込みサービス
│   └── dataLoader.test.ts  # テストファイル
└── utils/
    └── writeTextFileAsync.ts  # ファイル書き込みユーティリティ
```

## 学習ポイント

- RAGの基本概念
- ベクトルデータベースの操作
- MCPのTypeScriptでの立ち上げ方法

このプロジェクトでは以下の技術を学ぶことができます：

- **RAG (Retrieval-Augmented Generation)**: ベクトル検索と生成AIの組み合わせ
- **ベクトルデータベース**: テキストのベクトル化と検索
- **MCP (Model Context Protocol)**: TypeScriptでのサーバー立ち上げ方法

## テスト実行

```bash
npm test
```
