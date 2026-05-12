import { animatedAsset } from "./animatedAsset";
import { approvalLog } from "./approvalLog";
import { banner } from "./banner";
import { category } from "./category";
import { article } from "./article";
import { faq } from "./faq";
import { faqCollection } from "./faqCollection";
import { glossaryTerm } from "./glossaryTerm";
import { helpCenterSettings } from "./helpCenterSettings";
import { seo } from "./objects/seo";
import { animatedMedia } from "./objects/animatedMedia";
import { callout } from "./objects/callout";
import { faqSection } from "./objects/faqSection";
import { faqCollectionRef } from "./objects/faqCollectionRef";
import { codeBlock } from "./objects/codeBlock";

export const schemaTypes = [
  // Document types
  animatedAsset,
  approvalLog,
  banner,
  category,
  article,
  faq,
  faqCollection,
  glossaryTerm,
  helpCenterSettings,

  // Object types (used inside documents)
  seo,
  animatedMedia,
  callout,
  faqSection,
  faqCollectionRef,
  codeBlock,
];
