# Frontend container — builds the React/Vite app, then serves the static
# files with nginx. Two stages: a "build" stage (Node) and a small runtime
# stage (nginx). Only the built files end up in the final image.

# ---- Stage 1: build the static site ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL is baked into the JS at BUILD time (import.meta.env.VITE_API_URL),
# so it must be passed in as a build argument — not a runtime env var.
# IMPORTANT: no trailing slash, or requests become https://host//api/... (404).
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Stage 2: serve with nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
