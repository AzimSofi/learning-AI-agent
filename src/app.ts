import { MyMCPServer } from './services/mcpServer';

// サーバーを起動
const server = new MyMCPServer();
server.STDIOrun().catch(console.error);