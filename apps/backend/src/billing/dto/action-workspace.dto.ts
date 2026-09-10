import { IsString, IsNotEmpty } from 'class-validator';

export class ActionWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;
}
