// Playwright _electron 冒烟 e2e（规则 13/14）—— 可断言、可重复、零额度。
// 启动构建产物 → 断言主链路的关键 UI 真实渲染（项目库 → 开项目 → 画布工具栏/导出入口）。
// 任一断言失败即抛错、非零退出（CI-ready）。不触发真实 AI 生成/导出（不花额度）。
//
// 用法：pnpm run build && pnpm run test:e2e
import { _electron as electron } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let passed = 0;
function assert(cond, label) {
  if (!cond) throw new Error(`SMOKE FAIL: ${label}`);
  passed += 1;
  console.log(`  ✓ ${label}`);
}

const app = await electron.launch({
  executablePath: require("electron"),
  args: ["."],
  cwd: repoRoot,
  env: { ...process.env, NOMI_E2E_SMOKE: "1" },
});

try {
  const win = await app.firstWindow();
  await win.waitForLoadState("domcontentloaded");
  await win.waitForTimeout(1500);

  // 1) 主进程启动 + 渲染层加载（runtime.ts 拆分后的回归底线）
  assert((await win.title()).toLowerCase().includes("nomi"), "窗口标题含 Nomi");

  // 2) 项目库渲染（渲染 → IPC listProjects → projects/repository 真实数据）
  await win.getByText("项目库", { exact: false }).first().waitFor({ timeout: 8000 });
  assert(await win.getByText("30 秒体验", { exact: false }).first().isVisible(), "项目库 hero「30 秒体验」可见");

  // 3) 开示例项目 → 工作台画布（开项目 → readProject/资产 → 画布挂载）
  await win.locator('[role="button"]', { hasText: "示例：30 秒产品介绍" }).first().click();
  await win.waitForTimeout(2500);
  for (const name of ["创作", "生成", "预览", "导出"]) {
    assert(await win.getByRole("button", { name, exact: false }).first().isVisible(), `工作台工具栏「${name}」可见`);
  }
  assert(/projectId=/.test(win.url()), "工作台 URL 含 projectId");

  console.log(`\nSMOKE PASS: ${passed} assertions`);
} catch (error) {
  console.error(`\n${error?.message || error}`);
  await app.close();
  process.exit(1);
} finally {
  await app.close().catch(() => undefined);
}
