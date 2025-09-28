import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ragSystem } from '../src/app';

class MyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'my-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_files',
            description: '現在のワークスペースのファイル一覧を取得',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'query_rag',
            description: 'RAGシステムにクエリを投げて回答を取得',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '検索クエリ' },
              },
              required: ['query'],
            },
          },
          {
            name: 'load_rss_data',
            description: 'RSSフィードからデータをロード',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'RSS URL' },
                source: { type: 'string', description: 'ソース名' },
              },
              required: ['url', 'source'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'list_files') {
        try {
          const files = await fs.readdir(process.cwd());
          return {
            content: [
              {
                type: 'text',
                text: `Files in workspace: ${files.join(', ')}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${(error as Error).message}`,
              },
            ],
            isError: true,
          };
        }
      } else if (name === 'query_rag') {
        if (!ragSystem) {
          return {
            content: [{ type: 'text', text: 'RAG system not initialized.' }],
            isError: true,
          };
        }
        const query = args?.query as string;
        if (!query) {
          return {
            content: [{ type: 'text', text: 'Query is required.' }],
            isError: true,
          };
        }
        try {
          const queryEngine = ragSystem.index.asQueryEngine();
          const response = await queryEngine.query({ query });
          return {
            content: [{ type: 'text', text: response.toString() }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
            isError: true,
          };
        }
      } else if (name === 'load_rss_data') {
        const url = args?.url as string;
        const source = args?.source as string;
        if (!url || !source) {
          return {
            content: [{ type: 'text', text: 'URL and source are required.' }],
            isError: true,
          };
        }
        try {
          // DataLoaderServiceをインポートして使用
          const { DataLoaderService } = await import('../src/services/dataLoader');
          const dataLoader = new DataLoaderService();
          const articles = await dataLoader.loadFromRSS(url, source);
          return {
            content: [{ type: 'text', text: `Loaded ${articles.length} articles from ${source}.` }],
          };
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
            isError: true,
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: `Unknown tool: ${name}`,
          },
        ],
        isError: true,
      };
    });
  }

  async STDIOrun() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server running...');
  }
}

// サーバーを起動
const server = new MyMCPServer();
server.STDIOrun().catch(console.error);

