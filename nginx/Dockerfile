FROM nginx:1.26-alpine
RUN mkdir -p /var/cache/nginx
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
