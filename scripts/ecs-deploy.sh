#!/usr/bin/env bash
# Roll a new container image out to the Nestwell ECS service. Called by the GitHub Actions
# deploy workflow (needs the AWS CLI and jq, both preinstalled on GitHub's Ubuntu runners; it is written for
# Linux, so run it in CI, WSL or CloudShell rather than Git Bash).
#
#   1. Register a new task definition revision: the live one, with only the image swapped.
#      (Env vars, secrets, sizing and roles keep coming from infra/nestwell.yaml.)
#   2. Run `manage.py migrate` ONCE as a one-off task using the NEW image. Doing it here, not in
#      the container's start command, means it cannot race between several starting tasks, and a
#      failed migration stops the deploy while the old version keeps serving.
#   3. Point the service at the new revision and wait. ECS starts new tasks, waits for /healthz,
#      then drains the old ones; if the new tasks never become healthy it rolls back by itself.
#
# Env:  IMAGE_URI (required)   STACK_NAME (default: nestwell)   AWS_REGION / AWS_DEFAULT_REGION
#       DESIRED_COUNT (only used when the service is at 0, i.e. the very first deploy; default 1)
set -euo pipefail

STACK_NAME="${STACK_NAME:-nestwell}"
: "${IMAGE_URI:?Set IMAGE_URI to the image to deploy}"

stack_output() {
  aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

CLUSTER=$(stack_output ClusterName)
SERVICE=$(stack_output ServiceName)
LOG_GROUP=$(stack_output LogGroupName)
APP_URL=$(stack_output AppUrl)

SERVICE_JSON=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
  --query 'services[0]' --output json)
CURRENT_TASK_DEF=$(jq -r '.taskDefinition' <<<"$SERVICE_JSON")
DESIRED=$(jq -r '.desiredCount' <<<"$SERVICE_JSON")
NETWORK=$(jq -c '.networkConfiguration' <<<"$SERVICE_JSON")

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "==> Registering a task definition revision that runs $IMAGE_URI"
aws ecs describe-task-definition --task-definition "$CURRENT_TASK_DEF" \
  --query taskDefinition --output json |
  jq --arg image "$IMAGE_URI" '
    del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities,
        .registeredAt, .registeredBy, .deregisteredAt)
    | (.containerDefinitions[] | select(.name == "web") | .image) = $image' >"$WORK/task-def.json"
NEW_TASK_DEF=$(aws ecs register-task-definition --cli-input-json "file://$WORK/task-def.json" \
  --query taskDefinition.taskDefinitionArn --output text)
echo "    $NEW_TASK_DEF"

echo "==> Running database migrations (one-off task)"
TASK_ARN=$(aws ecs run-task --cluster "$CLUSTER" --task-definition "$NEW_TASK_DEF" \
  --launch-type FARGATE --network-configuration "$NETWORK" \
  --overrides '{"containerOverrides":[{"name":"web","command":["python","manage.py","migrate","--noinput"]}]}' \
  --query 'tasks[0].taskArn' --output text)
if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" = "None" ]; then
  echo "ERROR: ECS refused to start the migration task (no capacity, or a permissions problem)." >&2
  exit 1
fi
aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK_ARN"

TASK_ID="${TASK_ARN##*/}"
EXIT_CODE=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK_ARN" \
  --query "tasks[0].containers[?name=='web'].exitCode | [0]" --output text)
# Log stream name = <awslogs-stream-prefix>/<container name>/<task id>
aws logs get-log-events --log-group-name "$LOG_GROUP" --log-stream-name "web/web/$TASK_ID" \
  --query 'events[].message' --output text 2>/dev/null | tr '\t' '\n' || true
if [ "$EXIT_CODE" != "0" ]; then
  REASON=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$TASK_ARN" \
    --query 'tasks[0].stoppedReason' --output text)
  echo "ERROR: migrations failed (exit code: $EXIT_CODE; $REASON). The running version is untouched." >&2
  exit 1
fi

# The first deploy starts from a service scaled to 0 (there was no image to run).
if [ "$DESIRED" -eq 0 ]; then
  DESIRED="${DESIRED_COUNT:-1}"
fi

echo "==> Rolling out to $SERVICE ($DESIRED task(s))"
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" \
  --task-definition "$NEW_TASK_DEF" --desired-count "$DESIRED" --output none

DEADLINE=$((SECONDS + 900))
while :; do
  STATE=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query "services[0].deployments[?status=='PRIMARY'].rolloutState | [0]" --output text)
  echo "    rollout: $STATE"
  case "$STATE" in
    COMPLETED) break ;;
    FAILED)
      echo "ERROR: the new tasks did not become healthy; ECS is rolling back to the previous version." >&2
      aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
        --query 'services[0].events[:5].message' --output text >&2 || true
      echo "Look in CloudWatch Logs group $LOG_GROUP for the cause." >&2
      exit 1
      ;;
  esac
  if [ "$SECONDS" -ge "$DEADLINE" ]; then
    echo "ERROR: timed out after 15 minutes waiting for the rollout." >&2
    exit 1
  fi
  sleep 15
done

echo "Deployed $IMAGE_URI"
echo "$APP_URL"
