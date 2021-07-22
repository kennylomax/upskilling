FROM node:12-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

RUN npm install

# Bundle app source
COPY dist/ /usr/src/app/dist
COPY src/server/ /usr/src/app/

ENV PORT 3000

CMD [ "node", "index.js" ]
