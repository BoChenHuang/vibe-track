### Requirement: TrackResultDto provides single source of truth for track shape
The system SHALL define `TrackResultDto` as a class (not interface) with `@ApiProperty` decorators covering all six fields (`id`, `title`, `artist`, `spotify_url`, `preview_url`, `reason`), so that both TypeScript type inference and Swagger schema generation use the same definition.

#### Scenario: TrackResultDto used as return type in AnalyzeService
- **WHEN** `AnalyzeService.analyze()` is called
- **THEN** the method SHALL return `Promise<AnalyzeResponseDto>` where `AnalyzeResponseDto.tracks` is typed as `TrackResultDto[]`

#### Scenario: TrackResultDto reflected in Swagger schema
- **WHEN** Swagger generates the schema for the 200 response of `POST /analyze`
- **THEN** each item in the `tracks` array SHALL list all six fields with their types and examples

### Requirement: AnalyzeResponseDto wraps the tracks array
The system SHALL define `AnalyzeResponseDto` as a class with a `tracks` property typed as `TrackResultDto[]` and annotated with `@ApiProperty({ type: [TrackResultDto] })`.

#### Scenario: Controller return type is explicit
- **WHEN** a developer reads `AnalyzeController.analyze()`
- **THEN** the method signature SHALL declare an explicit return type of `Promise<AnalyzeResponseDto>`
- **THEN** the IDE SHALL be able to resolve the return type without following implicit inference chains

#### Scenario: ApiOkResponse uses type reference
- **WHEN** `@ApiOkResponse` is applied to the `analyze()` method
- **THEN** it SHALL use `{ type: AnalyzeResponseDto }` instead of an inline `schema` object

### Requirement: AnalyzeBodyDto describes multipart request fields
The system SHALL define `AnalyzeBodyDto` as a class with `text` (optional string) and `image` (binary) fields annotated with `@ApiProperty`, so that the `@ApiBody` decorator can use `{ type: AnalyzeBodyDto }` instead of an inline schema object.

#### Scenario: ApiBody uses type reference
- **WHEN** `@ApiBody` is applied to the `analyze()` method
- **THEN** it SHALL use `{ type: AnalyzeBodyDto }` instead of an inline `schema` object
- **THEN** the Swagger UI SHALL still show `text` as an optional string field and `image` as a binary file upload field
