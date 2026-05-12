import { useEffect, useState } from "react";
import {
  type StringInputProps,
  useClient,
  useFormValue,
  getPublishedId,
} from "sanity";
import { Card, Stack, Text, Badge, Flex, Box, Spinner } from "@sanity/ui";

const API_VERSION = "2024-01-01";

interface ApprovalLogEntry {
  _key: string;
  stage: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  comment?: string;
  documentRevision?: string;
  documentId?: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: string; tone: "positive" | "critical" }> = {
  approved: { label: "Approved", icon: "✅", tone: "positive" },
  changesRequested: { label: "Changes Requested", icon: "🔄", tone: "critical" },
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Read-only custom input component that displays the approval history
 * for an article. Fetches entries from the separate `approval-log.{articleId}`
 * document and renders them in reverse chronological order.
 *
 * Wired into article.ts as `components: { input: ApprovalHistoryInput }`
 * on a placeholder string field.
 */
export function ApprovalHistoryInput(_props: StringInputProps) {
  const client = useClient({ apiVersion: API_VERSION });
  const documentId = useFormValue(["_id"]) as string | undefined;
  const [entries, setEntries] = useState<ApprovalLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const publishedId = getPublishedId(documentId);
    const logDocId = `approval-log.${publishedId}`;

    // Initial fetch
    client
      .fetch<ApprovalLogEntry[] | null>(
        `*[_id == $id][0].entries`,
        { id: logDocId },
      )
      .then((result) => {
        setEntries(result ?? []);
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setLoading(false);
      });

    // Subscribe to live updates
    const subscription = client
      .listen<{ entries?: ApprovalLogEntry[] }>(
        `*[_id == $id]`,
        { id: logDocId },
        { includeResult: true },
      )
      .subscribe((update) => {
        if (update.type === "mutation" && update.result) {
          setEntries(update.result.entries ?? []);
        }
      });

    return () => subscription.unsubscribe();
  }, [client, documentId]);

  if (loading) {
    return (
      <Card padding={4} radius={2} tone="transparent">
        <Flex align="center" justify="center" gap={3}>
          <Spinner muted />
          <Text size={1} muted>Loading review history…</Text>
        </Flex>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card padding={4} radius={2} tone="transparent" border>
        <Text size={1} muted align="center">
          No review history yet
        </Text>
      </Card>
    );
  }

  // Reverse chronological — newest first
  const sorted = [...entries].reverse();

  return (
    <Stack space={3}>
      {sorted.map((entry) => {
        const config = ACTION_CONFIG[entry.action] ?? {
          label: entry.action,
          icon: "📋",
          tone: "positive" as const,
        };

        return (
          <Card key={entry._key} padding={3} radius={2} border>
            <Stack space={3}>
              <Flex align="center" gap={2} wrap="wrap">
                <Badge tone={config.tone} fontSize={1}>
                  {config.icon} {config.label}
                </Badge>
                <Text size={1} weight="medium">
                  {entry.userName}
                </Text>
                <Text size={1} muted>
                  {formatRelativeTime(entry.timestamp)}
                </Text>
              </Flex>
              {entry.comment && (
                <Box paddingLeft={1}>
                  <Text size={1} muted>
                    {entry.comment}
                  </Text>
                </Box>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
