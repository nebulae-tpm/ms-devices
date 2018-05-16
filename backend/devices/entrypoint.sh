#!/bin/sh

set -x

if [ -d /opt/flags ]; then
	sync -f /opt/flags
	if [ ! -f /opt/flags/lock_initialize ]; then
		sleep $(( $RANDOM % 10 ))
		echo $(hostname) > /opt/flags/lock_initialize
		sync /opt/flags/lock_initialize
		sleep $(( $RANDOM % 10 ))
		if [ "$(hostname)" = "$(cat /opt/flags/lock_initialize)" ]; then

			##########################################################################
			echo "ESTA LINEA SE REEMPLAZA POR EL COMANDO npm PARA LA INITICIALIZACION"
			sleep $(( $RANDOM % 60 ))
			##########################################################################

			echo $(hostname) > /opt/flags/lock_finalize
			sync /opt/flags/lock_finalize
		fi
	fi
	while [ ! -f /opt/flags/lock_finalize ]; do
		sleep $(( $RANDOM % 20 ))
	done
	if [ "$(hostname)" = "$(cat /opt/flags/lock_initialize)" ]; then
		rm /opt/flags/lock_initialize
		sync -f /opt/flags
	fi
fi

exec "$@"
