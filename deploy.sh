#!/usr/bin/env bash
set -euo pipefail

# Doc2SCORM Director — Cloud Run Deployment
# Usage: GCP_PROJECT_ID=my-project GEMINI_API_KEY=xxx ./deploy.sh

SERVICE_NAME="doc2scorm-backend"
REGION="${GCP_REGION:-us-central1}"

if [ -z "${GCP_PROJECT_ID:-}" ]; then
  echo "Error: GCP_PROJECT_ID is required"
  echo "Usage: GCP_PROJECT_ID=my-project GEMINI_API_KEY=xxx ./deploy.sh"
  exit 1
fi

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "Error: GEMINI_API_KEY is required"
  exit 1
fi

GALLERY_BUCKET="${GCS_GALLERY_BUCKET:-doc2scorm-gallery}"

echo "Deploying $SERVICE_NAME to Cloud Run..."
echo "  Project:  $GCP_PROJECT_ID"
echo "  Region:   $REGION"
echo "  Bucket:   $GALLERY_BUCKET"

# Create GCS gallery bucket if it doesn't exist (idempotent)
if ! gcloud storage buckets describe "gs://${GALLERY_BUCKET}" --project "$GCP_PROJECT_ID" &>/dev/null; then
  echo "Creating gallery bucket gs://${GALLERY_BUCKET}..."
  gcloud storage buckets create "gs://${GALLERY_BUCKET}" \
    --project "$GCP_PROJECT_ID" \
    --location "$REGION" \
    --uniform-bucket-level-access
  gcloud storage buckets add-iam-policy-binding "gs://${GALLERY_BUCKET}" \
    --member="allUsers" \
    --role="roles/storage.objectViewer"
fi

gcloud run deploy "$SERVICE_NAME" \
  --project "$GCP_PROJECT_ID" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --timeout 300 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,GCS_GALLERY_BUCKET=$GALLERY_BUCKET"

echo ""
echo "Deployment complete!"
gcloud run services describe "$SERVICE_NAME" \
  --project "$GCP_PROJECT_ID" \
  --region "$REGION" \
  --format "value(status.url)"
