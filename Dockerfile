# build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# serve static files con nginx
FROM nginx:alpine AS runtime
WORKDIR /usr/share/nginx/html
COPY --from=build /app/build .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
