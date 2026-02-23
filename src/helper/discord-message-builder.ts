export function buildMentionableUsersFromIds(userIds: string[]): string {
  return userIds.map((id) => `<@${id}>`).join(", ");
}
