import { banner } from "./banner";
import { category } from "./category";
import { article } from "./article";
import { faq } from "./faq";
import { faqCollection } from "./faqCollection";
import { helpCenterSettings } from "./helpCenterSettings";
import { seo } from "./objects/seo";
import { callout } from "./objects/callout";
import { faqSection } from "./objects/faqSection";
import { faqCollectionRef } from "./objects/faqCollectionRef";
import { codeBlock } from "./objects/codeBlock";

export const schemaTypes = [
  // Document types
  banner,
  category,
  article,
  faq,
  faqCollection,
  helpCenterSettings,

  // Object types (used inside documents)
  seo,
  callout,
  faqSection,
  faqCollectionRef,
  codeBlock,
];
