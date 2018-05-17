#!/bin/sh

set -x

sleep $(( $RANDOM % 10 ))

while [ 0 ]; do
	# exec lock
	/mbinit --step 1 --podName "$(hostname)" --url "$MONGODB_URL" \
		&& echo "ESTA LINEA SE REEMPLAZA POR EL COMANDO npm PARA LA INITICIALIZACION" \
           	#############################################################################

	# exec wait
	/mbinit --step 2 --podName "$(hostname)" --url "$MONGODB_URL" || continue
	# exec unlock
	/mbinit --step 3 --podName "$(hostname)" --url "$MONGODB_URL" || continue

	break
done

exec "$@"
