import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class TestSimulationDto {
  @IsString()
  @IsNotEmpty()
  inputMessage: string;

  @IsString()
  @IsOptional()
  sentiment?: string;
}
