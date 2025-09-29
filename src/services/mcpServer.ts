import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import * as fsPromises from 'fs/promises';
import { getRagSystem } from '../utils/ragSystem';
import { NewsArticle, DataLoaderService } from './dataLoader';

config();

export class MyMCPServer {
  private server: Server;
  private ragSystem!: Awaited<ReturnType<typeof getRagSystem>>;

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
            description: 'RSSフィードからデータをロードし、記事オブジェクトの配列を返す',
            inputSchema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'RSS URL' },
                source: { type: 'string', description: 'ソース名' },
              },
              required: ['url', 'source'],
            },
          },
          {
            name: 'add_articles_to_index',
            description: '記事オブジェクトの配列をRAGシステムのインデックスに追加する',
            inputSchema: {
              type: 'object',
              properties: {
                articles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      link: { type: 'string' },
                      pubDate: { type: 'string', format: 'date-time' },
                      content: { type: 'string' },
                      source: { type: 'string' },
                    },
                    required: ['title', 'link', 'content', 'source'],
                  }
                }
              },
              required: ['articles'],
            },
          }
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name: name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_files': {
            const files = await fsPromises.readdir(process.cwd());
            return { content: [{ type: 'text', text: `Files in workspace: ${files.join(', ')}` }] };
          }

          case 'query_rag': {
            const query = args?.query as string;
            if (!query) {
              throw new Error('Query is required.')
            }

            const response = await this.ragSystem.query(query);
            return { content: [{ type: 'text', text: response }] };
          }

          case 'load_rss_data': {
            const url = args?.url as string;
            const source = args?.source as string;
            if (!url || !source) throw new Error('URL and source are required.'); // MCP のスキーマで required: ['url', 'source']と"args?."が null や undefined の場合に undefined を返しますですから

            const dataLoader = new DataLoaderService();
            const articles = await dataLoader.loadFromRSS(url, source);
            return { content: [{ type: 'text', text: JSON.stringify(articles, null, 2) }] };
          }

          case 'add_articles_to_index': {
            const articles = args?.articles as NewsArticle[];
            if (!articles || !Array.isArray(articles)) throw new Error('Articles array is required.');
            const processedArticles = articles.map(article => ({
              ...article,
              pubDate: new Date(article.pubDate), // 記事のpubDateプロパティをDateオブジェクトに変換しています
            }));
            await this.ragSystem.addArticles(processedArticles);
            return { content: [{ type: 'text', text: `Successfully added ${articles.length} articles to the index.` }] };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${(error as Error).message}` }],
          isError: true,
        };
      }
    });
  }

  async initialize() {
    this.ragSystem = await getRagSystem();
  }

  async STDIOrun() {
    await this.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP server running...');
  }
}