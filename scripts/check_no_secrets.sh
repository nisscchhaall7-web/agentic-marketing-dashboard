#!/usr/bin/env bash
# Fails if a secret-looking value or a forbidden file is tracked in git.
# Run manually, as a pre-commit hook (see README), or in CI (.github/workflows/secret-scan.yml).
set -u
fail=0
bad_files=$(git ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' ; git ls-files | grep -Ei '\.(db|sqlite3?|pem|key|p12)$')
if [ -n "$bad_files" ]; then echo "Forbidden tracked files:"; echo "$bad_files"; fail=1; fi
pat='AKIA[0-9A-Z]{16}|ya29\.[0-9A-Za-z_-]{20,}|1//0[A-Za-z0-9_-]{20,}|EAA[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}|eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}|rds\.amazonaws\.com|(SECRET|PASSWORD|TOKEN|API_KEY|PRIVATE_KEY)[A-Z_]*[=:][ ]*["'"'"']?[A-Za-z0-9_./+-]{16,}'
hits=$(git grep -nEI "$pat" -- . ':!*.lock' ':!package-lock.json' ':!scripts/check_no_secrets.sh' ':!.github/workflows/secret-scan.yml' 2>/dev/null | cut -c1-140)
if [ -n "$hits" ]; then echo "Possible secrets:"; echo "$hits"; fail=1; fi
[ $fail -eq 0 ] && echo "secret scan: clean"
exit $fail
