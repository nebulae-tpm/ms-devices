FROM node:8.9-alpine
ENV NODE_ENV production
WORKDIR /nebulae/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
COPY mbinit /
COPY entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
CMD npm start

