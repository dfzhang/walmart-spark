import type { SlugIsUniqueValidator } from "sanity";

/**
 * Custom slug uniqueness check scoped to the same language.
 *
 * The default Sanity slug validation checks uniqueness globally per type,
 * which blocks translated documents from sharing the same slug as their
 * source document. This validator allows e.g. both the English and Spanish
 * versions of "getting-started" to coexist.
 */
export const isUniquePerLanguage: SlugIsUniqueValidator = async (
  slug,
  context
) => {
  const { document, getClient } = context;
  const client = getClient({ apiVersion: "2024-01-01" });
  const id = document?._id?.replace(/^drafts\./, "") ?? "";
  const language = (document?.language as string) || "en";

  const count = await client.fetch(
    `count(*[
      _type == $type
      && slug.current == $slug
      && language == $lang
      && !(_id in [$id, "drafts." + $id])
    ])`,
    {
      type: document?._type,
      slug,
      lang: language,
      id,
    }
  );

  return count === 0;
};
