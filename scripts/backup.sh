#!/bin/bash

###
# TaxSense AI Database Backup Script
# Performs automated backups with encryption and cross-region replication
# Usage: ./backup.sh [backup-type] [environment]
###

set -euo pipefail

# Configuration
BACKUP_TYPE="${1:-full}"
ENVIRONMENT="${2:-prod}"
BACKUP_DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/taxsense"
LOG_FILE="/var/log/taxsense/backup-${BACKUP_DATE}.log"
RETENTION_DAYS=30
AWS_REGION="${AWS_REGION:-us-east-1}"
S3_BUCKET="${S3_BUCKET:-taxsense-backups}"
ENCRYPTION_KEY="${ENCRYPTION_KEY:-/etc/taxsense/backup-key}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
  exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log_info "Starting $BACKUP_TYPE backup for $ENVIRONMENT environment"

# Verify prerequisites
if ! command -v pg_dump &> /dev/null; then
  log_error "pg_dump not found. Install PostgreSQL client tools."
fi

if ! command -v aws &> /dev/null; then
  log_error "AWS CLI not found. Install AWS CLI v2."
fi

if [[ ! -f "$ENCRYPTION_KEY" ]]; then
  log_error "Encryption key not found at $ENCRYPTION_KEY"
fi

# Get database connection details from environment
if [[ -z "${DATABASE_URL:-}" ]]; then
  log_error "DATABASE_URL environment variable not set"
fi

# Parse database URL
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)/\3/')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)/\4/')
DB_USER=$(echo "$DATABASE_URL" | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)/\1/')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)/\5/')

log_info "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Backup function
backup_database() {
  local backup_name="$1"
  local backup_file="$BACKUP_DIR/db-$backup_name-$BACKUP_DATE.sql"

  log_info "Creating $backup_name backup..."

  if [[ "$backup_name" == "full" ]]; then
    pg_dump \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --format=custom \
      --verbose \
      --no-password \
      "$DB_NAME" > "$backup_file" 2>&1 || log_error "Database backup failed"
  else
    pg_dump \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --format=custom \
      --data-only \
      --verbose \
      --no-password \
      "$DB_NAME" > "$backup_file" 2>&1 || log_error "Data-only backup failed"
  fi

  log_info "Backup file created: $backup_file ($(du -h "$backup_file" | cut -f1))"

  # Verify backup
  if pg_restore -l "$backup_file" &> /dev/null; then
    log_info "Backup verification successful"
  else
    log_error "Backup verification failed"
  fi

  echo "$backup_file"
}

# Compression and encryption
compress_and_encrypt() {
  local backup_file="$1"
  local encrypted_file="${backup_file}.gpg"

  log_info "Compressing and encrypting backup..."

  gzip "$backup_file" || log_error "Compression failed"
  gpg --symmetric --cipher-algo AES256 \
      --passphrase-file "$ENCRYPTION_KEY" \
      --output "$encrypted_file" \
      "${backup_file}.gz" || log_error "Encryption failed"

  rm -f "${backup_file}.gz"
  log_info "Encrypted backup: $encrypted_file ($(du -h "$encrypted_file" | cut -f1))"

  echo "$encrypted_file"
}

# Upload to S3
upload_to_s3() {
  local backup_file="$1"
  local s3_path="s3://$S3_BUCKET/$ENVIRONMENT/backups/$(basename "$backup_file")"

  log_info "Uploading to S3: $s3_path"

  aws s3 cp "$backup_file" "$s3_path" \
    --region "$AWS_REGION" \
    --storage-class STANDARD_IA \
    --sse AES256 \
    --metadata "backup-date=$BACKUP_DATE,environment=$ENVIRONMENT" || log_error "S3 upload failed"

  log_info "S3 upload successful"
}

# Replicate to secondary region
replicate_backup() {
  local backup_file="$1"
  local source_bucket="$S3_BUCKET"
  local dest_region="us-west-2"
  local dest_bucket="${S3_BUCKET}-us-west-2"

  log_info "Replicating backup to $dest_region..."

  aws s3 sync "s3://$source_bucket/$ENVIRONMENT/backups/" \
    "s3://$dest_bucket/$ENVIRONMENT/backups/" \
    --region "$AWS_REGION" \
    --storage-class GLACIER || log_warn "Replication failed but backup is secure"

  log_info "Replication completed"
}

# Cleanup old backups
cleanup_old_backups() {
  log_info "Cleaning up backups older than $RETENTION_DAYS days"

  # Local cleanup
  find "$BACKUP_DIR" -name "db-*.gpg" -mtime +$RETENTION_DAYS -delete

  # S3 cleanup
  aws s3 ls "s3://$S3_BUCKET/$ENVIRONMENT/backups/" --recursive | while read -r date time size file; do
    file_date=$(echo "$file" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
    if [[ -n "$file_date" ]]; then
      file_timestamp=$(date -d "$file_date" +%s)
      current_timestamp=$(date +%s)
      age_days=$(( (current_timestamp - file_timestamp) / 86400 ))

      if [[ $age_days -gt $RETENTION_DAYS ]]; then
        aws s3 rm "s3://$S3_BUCKET/$file" --region "$AWS_REGION"
        log_info "Deleted old backup: $file"
      fi
    fi
  done
}

# Test restore capability
test_restore() {
  local backup_file="$1"
  local test_db="taxsense_restore_test"

  log_info "Testing restore capability..."

  # Create test database
  createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" || {
    log_warn "Test database creation failed (may already exist)"
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db" 2>/dev/null || true
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db"
  }

  # Restore from backup
  if pg_restore -d "$test_db" -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$backup_file" 2>&1 | grep -q "^CREATE"; then
    log_info "Restore test successful"
    # Cleanup test database
    dropdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$test_db"
  else
    log_error "Restore test failed"
  fi
}

# Send notification
send_notification() {
  local status="$1"
  local message="$2"

  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d "{
        \"text\": \"Backup $status\",
        \"blocks\": [{
          \"type\": \"section\",
          \"text\": {
            \"type\": \"mrkdwn\",
            \"text\": \"$message\"
          }
        }]
      }" || log_warn "Slack notification failed"
  fi
}

# Main execution
main() {
  log_info "Starting backup process"

  # Create backup
  BACKUP_FILE=$(backup_database "$BACKUP_TYPE")

  # Compress and encrypt
  ENCRYPTED_FILE=$(compress_and_encrypt "$BACKUP_FILE")

  # Upload to S3
  upload_to_s3 "$ENCRYPTED_FILE"

  # Replicate to secondary region
  replicate_backup "$ENCRYPTED_FILE"

  # Cleanup old backups
  cleanup_old_backups

  # Test restore (optional, on-demand)
  if [[ "${TEST_RESTORE:-false}" == "true" ]]; then
    test_restore "$BACKUP_FILE"
  fi

  # Send notification
  send_notification "successful" \
    "Database backup completed for $ENVIRONMENT\nType: $BACKUP_TYPE\nSize: $(du -h "$ENCRYPTED_FILE" | cut -f1)\nDate: $BACKUP_DATE"

  log_info "Backup process completed successfully"
}

# Run main function
main
