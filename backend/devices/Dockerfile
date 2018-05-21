FROM node:8.9-alpine
ARG DOCKERHUB_TAG

ENV DOCKER_VERSION $DOCKERHUB_TAG
ENV NODE_ENV production
WORKDIR /nebulae/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
COPY mbinit /
COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD npm start

