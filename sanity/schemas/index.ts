import { category } from "./category";
import { article } from "./article";
import { helpCenterSettings } from "./helpCenterSettings";
import { seo } from "./objects/seo";
import { callout } from "./objects/callout";
import { faqSection } from "./objects/faqSection";
import { codeBlock } from "./objects/codeBlock";

export const schemaTypes = [
  // Document types
  category,
  article,
  helpCenterSettings,

  // Object types (used inside documents)
  seo,
  callout,
  faqSection,
  codeBlock,
];
