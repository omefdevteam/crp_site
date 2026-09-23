ALTER TABLE "excel_sync_state" ADD COLUMN "decision_offset" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
-- Backfill only records absent from the feed. Source locks prevent an older
-- baseline snapshot from being appended after a concurrent application update.
DO $$
DECLARE
  item record;
  next_revision bigint;
BEGIN
  LOCK TABLE applicants, waitlist, interest, nominations IN SHARE ROW EXCLUSIVE MODE;
  PERFORM 1 FROM sync_clock WHERE singleton = true FOR UPDATE;
  FOR item IN
    SELECT 'applicants'::text AS table_name, s.id, jsonb_build_object(
      'id', s.id,
      'version', s.version,
      'submittedAt', s.created_at,
      'fullName', s.full_name,
      'email', s.email,
      'dob', s.dob,
      'age', s.age,
      'track', s.track,
      'phone', s.phone,
      'nationality', s.nationality,
      'basedIn', s.based_in,
      'skills', s.skills,
      'canTravel', s.can_travel,
      'hasValidPassport', s.has_valid_passport,
      'language', s.language,
      'status', s.status,
      'round1Link', NULL,
      'round1CompletedAt', s.round1_completed_at,
      'identityStatus', s.identity_status,
      'identityCheckedAt', s.identity_checked_at,
      'interviewAt', s.interview_at,
      'docsStatus', s.docs_status,
      'lastSynced', s.updated_at
    ) AS payload FROM applicants s
    WHERE NOT EXISTS (SELECT 1 FROM sync_changes c WHERE c.table_name = 'applicants' AND c.record_id = s.id)
    UNION ALL
    SELECT 'waitlist'::text AS table_name, s.id, jsonb_build_object(
      'id', s.id,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at,
      'email', s.email,
      'name', s.name,
      'source', s.source,
      'status', s.status
    ) AS payload FROM waitlist s
    WHERE NOT EXISTS (SELECT 1 FROM sync_changes c WHERE c.table_name = 'waitlist' AND c.record_id = s.id)
    UNION ALL
    SELECT 'interest'::text AS table_name, s.id, jsonb_build_object(
      'id', s.id,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at,
      'email', s.email,
      'name', s.name,
      'ageGroup', s.age_group,
      'track', s.track,
      'source', s.source
    ) AS payload FROM interest s
    WHERE NOT EXISTS (SELECT 1 FROM sync_changes c WHERE c.table_name = 'interest' AND c.record_id = s.id)
    UNION ALL
    SELECT 'nominations'::text AS table_name, s.id, jsonb_build_object(
      'id', s.id,
      'createdAt', s.created_at,
      'updatedAt', s.updated_at,
      'nominatorName', s.nominator_name,
      'nominatorEmail', s.nominator_email,
      'nominatorPhone', s.nominator_phone,
      'nominatorOrganization', s.nominator_organization,
      'nominatorRelation', s.nominator_relation,
      'nomineeName', s.nominee_name,
      'nomineeEmail', s.nominee_email,
      'nomineeDob', s.nominee_dob,
      'nomineePhone', s.nominee_phone,
      'nomineeNationality', s.nominee_nationality,
      'nomineeBasedIn', s.nominee_based_in,
      'nomineeLocation', s.nominee_location,
      'track', s.track,
      'videoaskLink', s.videoask_link,
      'status', s.status
    ) AS payload FROM nominations s
    WHERE NOT EXISTS (SELECT 1 FROM sync_changes c WHERE c.table_name = 'nominations' AND c.record_id = s.id)
  LOOP
    UPDATE sync_clock SET revision = revision + 1 WHERE singleton = true RETURNING revision INTO next_revision;
    INSERT INTO sync_changes (revision, table_name, record_id, operation, payload)
      VALUES (next_revision, item.table_name, item.id, 'insert', item.payload);
  END LOOP;
END $$;
