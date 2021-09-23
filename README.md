Crowdsourced Upsklling App for SAPCX/SAP Munich Labs
=====
See https://cxwiki.sap.com/display/prodandtech/Software+Academy+2021+Filling+our+Skills+Gaps


To run/develop locally:
=====
Set up mongo connection and storage data
./setenvvars.sh:
export accountName="paths3"
export mongokey="9lZo...=="
export mongoDatabaseName="paths"
export mongoport=10255
export youtubeapikey="AIza...uI"
export azurestorageimageaccount="testingaccesstorage"
export azurestorageimageaccountkey="HVMZN...kQ=="
export azurestorageimageacontainername="upskillingimages"
export azurestorageimageconnectionstring="DefaultEndpointsProtocol=https;...=core.windows.net"


# SAP CX Learning Paths
SET ENV VARS
source ./setenvvars.sh

BUILD
ng b

RUN AS ANGULAR APP
node src/server/index.js

RUN LOCALLY ON DOCKER
docker run -p3000:3000 --env accountName --env  mongokey --env mongoDatabaseName --env mongoport --env youtubeapikey --env  azurestorageimageaccount --env azurestorageimageaccountkey --env azurestorageimageacontainername dockerimage

RUN ON K8S
ng b
docker build -t kenlomax/pathsa:v0.109 .
docker push kenlomax/pathsa:v0.109
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml  apply -f pathsadeploymentwithingress.yml

GARDENER Link:
https://dashboard.garden.canary.k8s.ondemand.com/namespace/garden-klxtrial/shoots/

CONVERGED CLOUD Links:
https://dashboard.eu-nl-1.cloud.sap/monsoon3/home
https://dashboard.eu-nl-1.cloud.sap/monsoon3/sapcxacademy/home
Redirect your DNS entry to point crowdsourced.upskilling.only.sap to the deployed app's URL

DEPLOY AS K8S
A place for crowd sourcing the best material for SAPCX upskilling, with material recommended from our engineers.

[Based on this tutorial](https://docs.microsoft.com/en-gb/azure/cosmos-db/tutorial-develop-mongodb-nodejs)


To get HTTPS Certificate for Ingress in k8s yaml:
Get certificate csr and key:
 openssl req -new -newkey rsa:2048 -nodes \
        -out tls.csr \
        -keyout tls.key \
        -subj "/C=DE/L=GCP/O=SAP/OU=CX Academy/CN=crowdsourced.upskilling.only.sap"

Get Certificate by pasting csr file into  https://getcerts.wdf.global.corp.sap/pgwy/request/sapnetca_base64.html
-> /Users/d061192/Siggy

Create K8s Secret with key and crt files :
kubectl  --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml create secret tls crowdsourcedsecret-tls --key="tls.key" --cert="tls.crt"
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml get secrets 
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml get secret crowdsourcedsecret-tls -o yaml
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml delete secrets crowdsourcedsecret-tls


