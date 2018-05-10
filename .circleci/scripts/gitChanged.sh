#!/bin/bash
gitChanged(){
    LATEST_COMMIT=$(git rev-parse HEAD)
    FOLDER_COMMIT=$(git log -1 --format=format:%H --full-diff $1 )
    if [[ $FOLDER_COMMIT = $LATEST_COMMIT ]];
        then
            echo "files in $1 has changed"
            return 1
        else       
            echo "folder $1 did no changed"
        return 0
    fi
}