import { createNomiApp } from "./app";
import { loadLocalEnvFiles } from "./platform/node/local-env";
import { createNodeWorkerEnv } from "./platform/node/node-env";
import { createHonoNodeServer } from "./platform/node/hono-node-server";
import { maybeAutostartAgentsBridge } from "./platform/node/agents-bridge-autostart";
import { getPlatform } from "./platform/current-platform.js";

async function bootstrap() {
	loadLocalEnvFiles();
	const platform = getPlatform();
	// eslint-disable-next-line no-console
	console.log(`[nomi] platform: ${platform.mode} (db=${platform.dbProvider}, assets=${platform.assetStorage}, identity=${platform.identityMode})`);
	await maybeAutostartAgentsBridge();

	const honoApp = await createNomiApp();
	const env = await createNodeWorkerEnv();
	const server = createHonoNodeServer(honoApp, env);

	const portRaw = Number(process.env.PORT || 8788);
	const port = Number.isFinite(portRaw) ? portRaw : 8788;
	await new Promise<void>((resolve) => {
		server.listen(port, "0.0.0.0", resolve);
	});
	// eslint-disable-next-line no-console
	console.log(`[api] listening on http://localhost:${port}`);
}

void bootstrap();
