import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: "mcp-test-server",
    version: "1.0.0",
});

server.registerTool("add",
    {
        title: "Addition Tool",
        description: "Add two numbers",
        inputSchema: { a: z.number(), b: z.number() },
    },
    async ({ a, b }) => ({
        content: [{ type: "text", text: String(a + b) }]
    })
);

server.registerResource("About Azim",
    new ResourceTemplate(
        "azim://profile/{info}",
        {
            // list: undefined, // でも大丈夫そう。なぜかっという、
            // listはただテンプレートに一致する具体的なリソースのURIのリストをクライアントに提供する方法だけです
            list: async () => ({
                resources: [
                    { uri: "azim://profile/仕事", name: "仕事" },
                    { uri: "azim://profile/国籍", name: "国籍" },
                    { uri: "azim://profile/趣味", name: "趣味" },
                    { uri: "azim://profile/年齢", name: "年齢" }
                ]
            }),
            
            complete: { // completeはただautocompletionだから、書かなくても大丈夫
                info: async (prefix) => {
                    const possibleValues = ["仕事", "国籍", "趣味", "年齢"];
                    return possibleValues.filter(value => value.startsWith(prefix || ""));
                }
            }
        }
    ),
    {
        title: "Azim's profile",
        description: "Get to know about Azim's (仕事, 国籍, 趣味, 年齢)",
    },
    async (uri, variables) => {
        const info = variables.info as string;
        let text = "";

        info === "仕事" ? text = "ソフトウェアエンジニア" : 
        info === "国籍" ? text = "マレーシア人" : 
        info === "趣味" ? text = "プログラミングと読書" : 
        info === "年齢" ? text = "24歳" : 
        text = "指定された情報が見つかりません。可能な値: 仕事, 国籍, 趣味, 年齢";

        return {
            contents: [{
                uri: uri.href, // コンテンツの識別と整合性を保つために
                mimeType: "text/plain",
                text: text
            }]
        };
    }
);

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
    console.error("MCP server running");
});
