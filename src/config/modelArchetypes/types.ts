// 模型档案（Model Archetype）——「这个模型长什么样」的 curated 描述：模式、参考槽、
// 标量参数。**与供应商无关**：档案按模型身份认（identifierPatterns / 显式 meta.archetypeId），
// 不关心是 kie 还是 fal/replicate/自建中转。供应商只管传输（baseURL/鉴权/请求形状）。
//
// 设计原则（用户拍板）：通用第一 —— 任何人、经任何供应商接入同一个模型，都吃到同一套模板。
//
// 规则 1/9：标量参数**复用**现有的 `ModelParameterControl`（src/config/modelCatalogMeta.ts），
// 不另造一套 —— 档案与 onboarding 解析是「两个来源、同一套控件类型」，渲染路径单一。
// 档案只新增现有层没有的概念：模式（modes）、意图（intent）、typed 多参考槽（reference slots，
// 现有层只有按 key 名猜的 image-url，表达不了 character1..N / 视频 / 音频）。

import type { ModelParameterControl } from "../modelCatalogMeta";

export type ArchetypeReferenceSlotKind =
  | "first_frame"
  | "last_frame"
  | "image_ref" // 多图，按序对应 prompt 里的 character1..N
  | "video_ref"
  | "audio_ref"
  | "source_video";

export type ArchetypeReferenceSlot = {
  kind: ArchetypeReferenceSlotKind;
  label: string;
  min: number;
  max: number;
};

/** 跨模型统一的「意图」——UI 主标签按它走（角色参考/单图首帧/首尾帧/文生/视频编辑）。 */
export type ArchetypeIntent = "text" | "single" | "firstlast" | "character" | "edit";

export type ArchetypeMode = {
  id: string;
  intent: ArchetypeIntent;
  /** 该模型自己的叫法（副标签，如 Seedance 的「全能参考」）。 */
  vendorTerm: string;
  hint: string;
  slots: ArchetypeReferenceSlot[];
  /** 标量参数：复用现有控件类型（规则 1，不另造）。 */
  params: ModelParameterControl[];
  promptRequired: boolean;
};

export type ModelArchetype = {
  id: string; // 'seedance-2'
  family: string; // 'seedance'
  label: string; // 'Seedance 2.0'
  kind: "video";
  modes: ArchetypeMode[];
  defaultModeId: string;
  /**
   * 识别用：模型身份（modelKey/别名）匹配这些 pattern 之一就套这套档案。
   * 匹配规则见 resolveArchetypeForModel —— 按「整串相等」或「去掉 vendor 前缀后的末段相等」，
   * 故 'seedance-2' 不会误命中 'seedance-2-fast'。
   */
  identifierPatterns: string[];
};
