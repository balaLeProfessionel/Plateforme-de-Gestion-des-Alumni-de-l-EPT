# Build
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Écrite dans le JavaScript servi au navigateur : ce n'est pas un secret côté client.
ARG PRIMENG_LICENSE
RUN npm run build

# Runtime (Nginx)
FROM nginx:alpine

COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
