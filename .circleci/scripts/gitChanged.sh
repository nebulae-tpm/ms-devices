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


# Commit and push the package-lock.json
# Arguments:
#   github user email
#   github user name
#   github user token
#   github repo path eg: nebulae-tpm/emi
#   github repo branch eg: master
gitPublishPackageLockChanges(){    
    echo "gitPublishPackageLockChanges"    
    git status -s
    echo 'a=$( git status -s | grep package-lock.json | wc -l  || echo 0 )'
    a=$( git status -s | grep "package-lock.json" | wc -l  || echo 0 )
    echo $a
    if [ $a -ne 0 ]
        then
            echo "package-lock.json modified: commiting and pushing changes"
            git config credential.helper 'cache --timeout=120'
            git config user.email $1
            git config user.name $2   

            # Push quietly to prevent showing the token in log
            git add frontend/emi/package-lock.json            
            echo 'file added to git'
            git commit -m 'CircleCI has updated locked npm versions [ci skip]' frontend/emi/package-lock.json 
            echo 'file commited to git'
            git push -q https://$3@github.com/$4.git $5
            echo 'file pushed to git'
            return 0
        else       
            echo "package-lock.json was NOT modified"
            return 0
    fi
}