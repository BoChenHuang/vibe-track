## ADDED Requirements

### Requirement: Analyze endpoint is documented in Swagger UI
The system SHALL expose the `POST /analyze` endpoint in Swagger UI (`/api/docs`) with complete request and response schema so that developers can understand and test the endpoint without additional documentation.

#### Scenario: Swagger UI shows analyze endpoint
- **WHEN** a developer navigates to `/api/docs`
- **THEN** the `/analyze` POST endpoint SHALL appear under an `analyze` tag with a summary and description

#### Scenario: Request schema shows text and image fields
- **WHEN** the developer expands the `/analyze` endpoint in Swagger UI
- **THEN** the request body schema SHALL show `text` as an optional string field (maxLength 300) and `image` as an optional binary file field
- **THEN** the content type SHALL be listed as `multipart/form-data`

#### Scenario: Response schema shows tracks array
- **WHEN** the developer views the response section of `/analyze`
- **THEN** the 200 response schema SHALL show an object with a `tracks` array, where each item contains `title`, `artist`, `spotify_url`, `preview_url`, and `reason` fields

#### Scenario: Swagger UI can execute a text-only analyze request
- **WHEN** the developer fills in the `text` field in Swagger UI and clicks "Execute"
- **THEN** the request SHALL be sent as `multipart/form-data` with the text value
- **THEN** the response SHALL be displayed in the Swagger UI

### Requirement: AnalyzeDto text field is described in Swagger
The system SHALL annotate the `text` field in `AnalyzeDto` with Swagger metadata so that the field description, optionality, and constraints are visible in the generated schema.

#### Scenario: text field appears with metadata
- **WHEN** Swagger generates the schema for the analyze endpoint
- **THEN** the `text` field SHALL have `maxLength: 300` and an example value in its schema
