#!/bin/sh

set -x

sleep $(( $RANDOM % 5 ))

while [ 0 ]; do
	# exec lock
	/mbinit --step 1 --podName "$(hostname)" --url "$MONGODB_URL" --buildVersion "$DOCKER_VERSION" --runLockVer "$LOCKVERSION" \
		&& npm run sync-state
           	#############################################################################

	# exec wait
	/mbinit --step 2 --podName "$(hostname)" --url "$MONGODB_URL" --buildVersion "$DOCKER_VERSION" --runLockVer "$LOCKVERSION" || continue
	# exec unlock
	/mbinit --step 3 --podName "$(hostname)" --url "$MONGODB_URL" --buildVersion "$DOCKER_VERSION" --runLockVer "$LOCKVERSION" || continue
	# exec indexes
	/mbinit --step 4 --podName "$(hostname)" --url "$MONGODB_URL" --buildVersion "$DOCKER_VERSION" --runLockVer "$LOCKVERSION" \
		&& npm run prepare


	break
done

exec "$@"
