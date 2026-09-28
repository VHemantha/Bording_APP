#!/usr/bin/env bash
# Create or update the CloudFormation stack (infra/nestwell.yaml) without disturbing what the
# CD pipeline has deployed.
#
#   scripts/aws-infra.sh GitHubRepo=VHemantha/Bording_APP AnthropicSecretArn=arn:aws:...   # first time
#   scripts/aws-infra.sh DomainName=www.example.com HostedZoneId=Z0123456789ABC           # later change
#
# Arguments are KEY=VALUE template parameters. Anything you leave out keeps its current value
# (or the template default on the first run). Why not plain `aws cloudformation deploy`? CD
# swaps the container image behind CloudFormation's back; a bare stack update would carry the
# stale "ImageUri"/"DesiredCount" parameters back in and roll production back to them. This
# script reads the LIVE image and task count from ECS and passes them through.
#
# Env: STACK_NAME (default: nestwell), AWS_REGION / AWS_DEFAULT_REGION
# Needs: the AWS CLI. Run it from Git Bash, WSL, macOS/Linux, or AWS CloudShell.
set -euo pipefail

STACK_NAME="${STACK_NAME:-nestwell}"
TEMPLATE="$(cd "$(dirname "$0")/.." && pwd)/infra/nestwell.yaml"
# Git Bash on Windows: hand the native aws.exe a C:/... path, not /c/...
if command -v cygpath >/dev/null 2>&1; then TEMPLATE="$(cygpath -m "$TEMPLATE")"; fi

CURRENT=()   # parameters the existing stack already has
LIVE=()      # what is actually running right now

if aws cloudformation describe-stacks --stack-name "$STACK_NAME" >/dev/null 2>&1; then
  echo "==> Stack $STACK_NAME exists; reading its current parameters and running image"
  while IFS=$'\t' read -r key value; do
    [ "$value" = "None" ] && value=""
    CURRENT+=("$key=$value")
  done < <(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
    --query 'Stacks[0].Parameters[].[ParameterKey,ParameterValue]' --output text)

  output() {
    aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
      --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
  }
  CLUSTER=$(output ClusterName)
  SERVICE=$(output ServiceName)
  TASK_DEF=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].taskDefinition' --output text)
  IMAGE=$(aws ecs describe-task-definition --task-definition "$TASK_DEF" \
    --query "taskDefinition.containerDefinitions[?name=='web'].image | [0]" --output text)
  DESIRED=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" \
    --query 'services[0].desiredCount' --output text)
  case "$IMAGE" in
    *:bootstrap) ;;  # nothing has been deployed yet; keep the template's placeholder
    *) LIVE+=("ImageUri=$IMAGE") ;;
  esac
  LIVE+=("DesiredCount=$DESIRED")
else
  echo "==> Stack $STACK_NAME does not exist yet; creating it"
fi

# Merge current < your arguments < live values; a later KEY overrides an earlier one.
OVERRIDES=()
while IFS= read -r line; do
  [ -n "$line" ] && OVERRIDES+=("$line")
done < <(printf '%s\n' ${CURRENT[@]+"${CURRENT[@]}"} "$@" ${LIVE[@]+"${LIVE[@]}"} |
  awk '/=/ { k = substr($0, 1, index($0, "=") - 1)
             if (!(k in seen)) { seen[k] = ++n; order[n] = k }
             val[k] = substr($0, index($0, "=") + 1) }
       END { for (i = 1; i <= n; i++) print order[i] "=" val[order[i]] }')

aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE" \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  ${OVERRIDES[@]+--parameter-overrides "${OVERRIDES[@]}"}

echo
aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[].[OutputKey,OutputValue]' --output table
