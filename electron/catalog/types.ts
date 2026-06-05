// Catalog 领域类型的单一真相源（从 runtime.ts 抽出 —— 评审 CTO/M1 + 审计 P0-3）。
// electron 内部各处（runtime / seedBuiltins / kieSeedance …）一处定义、各处 import，避免漂移。
// 渲染层不消费这些（electron 专用；渲染层有自己的 DTO，经 desktopClient 单源）。
import type { ApiKeyRecord } from "./secrets";

export type BillingModelKind = "text" | "image" | "video" | "audio";
export type ProfileKind =
  | "chat"
  | "prompt_refine"
  | "text_to_image"
  | "image_to_prompt"
  | "image_to_video"
  | "text_to_video"
  | "image_edit"
  | "text_to_audio"
  | "image_to_audio";

export type AiSdkProviderKind = "openai-compatible" | "anthropic";

export type Vendor = {
  key: string;
  name: string;
  enabled: boolean;
  hasApiKey?: boolean;
  baseUrlHint?: string | null;
  authType?: "none" | "bearer" | "x-api-key" | "query";
  authHeader?: string | null;
  authQueryParam?: string | null;
  /**
   * Which Vercel AI SDK provider implementation to use for this vendor.
   * Optional; absent / unknown values fall back to "openai-compatible"
   * so existing model-catalog.json files keep working without migration.
   */
  providerKind?: AiSdkProviderKind;
  meta?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type Model = {
  modelKey: string;
  vendorKey: string;
  modelAlias?: string | null;
  labelZh: string;
  kind: BillingModelKind;
  enabled: boolean;
  meta?: unknown;
  pricing?: {
    cost: number;
    enabled: boolean;
    createdAt?: string;
    updatedAt?: string;
    specCosts: Array<{ specKey: string; cost: number; enabled: boolean; createdAt?: string; updatedAt?: string }>;
  };
  /**
   * Catalog v2+: present when this model was produced by the onboarding agent.
   * Carries the doc-quote evidence per parameter so we can audit / re-trial later.
   */
  onboarding?: {
    addedVia: "agent" | "manual";
    trialId?: string;
    docsUrl?: string;
    addedAt: string;
    fields: Array<{
      key: string;
      displayName: string;
      type: "select" | "number" | "text" | "boolean" | "image-url";
      options?: Array<{ value: string; label: string }>;
      default?: string;
      evidence: {
        field: string;
        evidence: string;
        evidence_location: string;
        confidence: "high" | "medium" | "low";
      };
    }>;
  };
  createdAt: string;
  updatedAt: string;
};

/**
 * A single HTTP call template: method + path (relative to vendor.baseUrl, or
 * absolute), headers, query, body. String values may contain `{{...}}`
 * placeholders resolved by `renderTemplateValue` against the request context.
 * `response_mapping` / `provider_meta_mapping` describe how to read the
 * upstream response (used by `buildProfileTaskResult`).
 */
export type HttpOperation = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, unknown>;
  body?: unknown;
  response_mapping?: Record<string, unknown>;
  provider_meta_mapping?: Record<string, unknown>;
};

/**
 * One (vendor, taskKind) → one mapping row. `create` is the synchronous POST
 * (or whatever initiates the task). `query` is the poll for async APIs.
 * Vendors that map their status strings to ours can use `statusMapping`
 * (e.g. `{ succeeded: ["completed", "done"] }`).
 */
export type Mapping = {
  id: string;
  vendorKey: string;
  taskKind: ProfileKind;
  name: string;
  enabled: boolean;
  create: HttpOperation;
  query?: HttpOperation;
  statusMapping?: Record<string, string[]>;
  createdAt: string;
  updatedAt: string;
};

/** Catalog version.
 *  v2 added Model.onboarding + ApiKeyRecord.enc.
 *  v3 collapsed Mapping.{requestMapping,responseMapping} (which used to wrap
 *  things in a v2 envelope `{version, create:{default}, query:{default}}`) into
 *  flat Mapping.{create,query} HttpOperation fields. Old rows are normalized
 *  in `migrateCatalogForward`.
 */
export type CatalogVersion = 1 | 2 | 3;
export const CURRENT_CATALOG_VERSION: CatalogVersion = 3;

export type CatalogState = {
  version: CatalogVersion;
  vendors: Vendor[];
  models: Model[];
  mappings: Mapping[];
  apiKeysByVendor: Record<string, ApiKeyRecord>;
};
