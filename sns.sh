#!/bin/bash

# Check if NODE_ENVR is set
if [ -z "$NODE_ENVR" ]; then
  echo "NODE_ENVR is not set."
  exit 1
fi

# Variables based on the value of NODE_ENVR
case "$NODE_ENVR" in
  "development")
    TOPIC_ARN="arn:aws:sns:us-east-1:377359377342:dev-service-updater"
    MESSAGE='{"cluster": "dev-cluster", "service": "cm-analytics-migration-dev-service", "desiredCount": 0}'
    SUBJECT="Migrations"
    ;;
  "staging")
    # Variables
    TOPIC_ARN="arn:aws:sns:us-east-1:377359377342:staging-service-updater"
    MESSAGE='{"cluster": "staging-cluster", "service": "cm-analytics-migration-staging-service", "desiredCount": 0}'
    SUBJECT="Migrations"
    ;;
  "production")
    echo "You are in the production environment."
    ;;
  *)
    echo "Unknown environment: $NODE_ENVR"
    ;;
esac
aws sns publish --topic-arn "$TOPIC_ARN" --message "$MESSAGE" --subject "$SUBJECT"