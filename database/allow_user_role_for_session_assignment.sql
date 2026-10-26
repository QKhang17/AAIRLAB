-- Allow newly created generic accounts to remain USER until a manager
-- assigns them to a session. The session transaction then promotes the
-- selected account to the role required by its assignment slot.
ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_role;

ALTER TABLE users ADD CONSTRAINT ck_users_role CHECK (
    role IN (
        'USER',
        'ADMIN',
        'MANAGER',
        'AI_LABELER',
        'MANUAL_LABELER',
        'REVIEWER',
        'RESULT_ANALYST',
        'TERMINOLOGY'
    )
);
