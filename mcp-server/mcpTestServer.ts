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
            list: async () => ({
                resources: [
                    { uri: "azim://profile/仕事", name: "仕事" },
                    { uri: "azim://profile/国籍", name: "国籍" },
                    { uri: "azim://profile/趣味", name: "趣味" },
                    { uri: "azim://profile/年齢", name: "年齢" }
                ]
            }),
            complete: {
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
        switch (info) {
            case "仕事":
                text = "Azimはソフトウェアエンジニアです。";
                break;
            case "国籍":
                text = "Azimの国籍は日本です。";
                break;
            case "趣味":
                text = "Azimの趣味はプログラミングと読書です。";
                break;
            case "年齢":
                text = "Azimの年齢は秘密です。";
                break;
            default:
                text = "指定された情報が見つかりません。可能な値: 仕事, 国籍, 趣味, 年齢";
        }

        return {
            contents: [{
                uri: uri.href,
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
