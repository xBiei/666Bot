import { ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';
import { CommandData } from '../index';

export class MissingPermissionsException {
  public message = 'Missing permissions:';

  constructor(public permissions: string[]) {}

  public toString() {
    return `${this.message} ${this.permissions.join(', ')}`;
  }
}

export interface PermissionResult {
  result: boolean;
  missing: string[];
}

export async function checkPermissions(
  command: CommandData,
  interaction: ChatInputCommandInteraction
): Promise<PermissionResult> {
  const member = await interaction.guild!.members.fetch({ user: interaction.client.user!.id });
  const requiredPermissions = command.info.permissions as PermissionResolvable[];

  if (!command.info.permissions) return { result: true, missing: [] };

  const missing = member.permissions.missing(requiredPermissions);

  return { result: !Boolean(missing.length), missing };
}
