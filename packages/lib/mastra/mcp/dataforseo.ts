import { MCPClient } from '@mastra/mcp';

export const dataforseoMcpClient = new MCPClient({
  id: 'dataforseo-mcp-client',
  servers: {
    dataforseo: {
      command: 'ENABLED_MODULES="SERP,KEYWORDS_DATA" npx',
      args: ['-y', 'dataforseo-mcp-server'],
    },
  },
});
