Crowdsourced Upsklling App for SAPCX/SAP Munich Labs
=====
See https://wiki.wdf.sap.corp/wiki/display/prodandtech/Crowdsourced+Upskilling+App


## To run/develop locally:

- Set up mongo connection and storage data in ./setenvvars.sh:
```
export accountName="paths3"
export mongokey="9lZo...=="
export mongoDatabaseName="paths"
export mongoport=10255
export youtubeapikey="AIza...uI"
export azurestorageimageaccount="testingaccesstorage"
export azurestorageimageaccountkey="HVMZN...kQ=="
export azurestorageimageacontainername="upskillingimages"
export azurestorageimageconnectionstring="DefaultEndpointsProtocol=https;...=core.windows.net"
```

- personalize then source ./setenvvars.sh: **source ./setenvvars.sh**
- install npm modules: **npm install**
- build npm application: **ng b**
- run the server: **node src/server/index.js**
- access the site @ **localhost:3000**

## To run locally on docker
- build project: **ng b**
- build docker image: **docker build -t kenlomax/pathsa:v0.133 .**
- push docker image: **docker push kenlomax/pathsa:v0.133 **
- run on docker: **docker run -p3000:3000 --env accountName --env  mongokey --env mongoDatabaseName --env mongoport --env youtubeapikey --env  azurestorageimageaccount --env azurestorageimageaccountkey --env azurestorageimageacontainername kenlomax/pathsa:v0.133**

## To Run on Gardener, Converged Cloud:
- Push to docker hub: **docker push kenlomax/pathsa:v0.133**
- View Gardener K8s Cluster @ https://dashboard.garden.canary.k8s.ondemand.com/namespace/garden-klxtrial/shoots/ and the k8s dashboard links
- Open Gardener K8s Dashboard: 
  - kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml  proxy
  - http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/
- View your SAP Converged Cloud @ **https://dashboard.eu-nl-1.cloud.sap/monsoon3/sapcxacademy/home**
- Either ..
  - Get your kube config from Gardener @ https://dashboard.garden.canary.k8s.ondemand.com/namespace/garden-klxtrial/shoots/
  - Deploy to your k8s cluster: **kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml  apply -f pathsadeploymentwithingress.yml**
- or, 
  - adjust deployment file directly in Gardener
- More on only.sap websites @ https://documentation.global.cloud.sap/networking/dns#internal-sap-hosted-zones
- More on DNS config @ https://documentation.global.cloud.sap/networking/dns-start-create-dns-zone
- CONVERGED CLOUD Links: https://dashboard.eu-nl-1.cloud.sap/monsoon3/home, https://dashboard.eu-nl-1.cloud.sap/monsoon3/sapcxacademy/home
- Redirect your DNS entry to point crowdsourced.upskilling.only.sap to the deployed app's URL


## To get HTTPS Certificate for Ingress in k8s yaml:
- Get certificate csr and key:
 openssl req -new -newkey rsa:2048 -nodes \
        -out tls.csr \
        -keyout tls.key \
        -subj "/C=DE/L=GCP/O=SAP/OU=CX Academy/CN=crowdsourced.upskilling.only.sap"

- Get Certificate by pasting csr file into  https://getcerts.wdf.global.corp.sap/pgwy/request/sapnetca_base64.html
-> /Users/d061192/Siggy
- Create K8s Secret with key and crt files :
kubectl  --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml create secret tls crowdsourcedsecret-tls --key="tls.key" --cert="tls.crt"
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml get secrets 
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml get secret crowdsourcedsecret-tls -o yaml
kubectl --kubeconfig /Users/d061192/Downloads/kubeconfig--klxtrial--q40tlog33j.yaml delete secrets crowdsourcedsecret-tls


