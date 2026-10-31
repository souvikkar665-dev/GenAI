# AWS integration and deployment boundary

The local prototype runs with Python and standard-library HTTP serving; PostgreSQL persistence is enabled by `BOARDROOM_POSTGRES_DSN`. AWS is intentionally not configured yet. Attach Amazon API Gateway and AWS Lambda around the Python API, Amazon Bedrock for structured question understanding and prose explanation, Amazon SageMaker AI for numeric estimates, Amazon Step Functions for observable/retryable long-running workflows, Amazon S3 for large files/exports/model artifacts, and IAM/KMS/Secrets Manager/CloudWatch/CloudTrail for security and operations.

`backend/integrations/` contains fail-closed Python adapter interfaces. They do not issue AWS requests. Add credentials only through a later managed secret/environment setup; never place them in the ZIP, SQL, HTML, or JavaScript. Before real use, configure authentication, tenant isolation, session-bound roles, migrations, backups, rate limits, privacy-safe logging, and operational monitoring.
