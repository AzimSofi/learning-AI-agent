import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
    {
        name: "mcp-test-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "add") {
        const args = request.params.arguments || {};
        const a = args.a;
        const b = args.b;

        if (typeof a !== 'number' || typeof b !== 'number') {
            throw new Error("Invalid arguments for 'add' tool: 'a' and 'b' must be numbers.");
        }
        return { result: a + b };
    }
    throw new Error("Unknown tool");
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "add",
                description: "Add two numbers",
                inputSchema: {
                    type: "object",
                    properties: {
                        a: { type: "number" },
                        b: { type: "number" },
                    },
                    required: ["a", "b"],
                },
            },
        ],
    };
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
    console.error("MCP server running");
});