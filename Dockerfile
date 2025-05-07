FROM ubuntu/apache2
MAINTAINER mungert@gmail.com
RUN apt-get update;\apt-get upgrade;\a2enmod rewrite;\a2enmod ssl; \a2enmod headers ;  apt-get clean
COPY ./out/ /var/www/html/
COPY ./out/images/ /var/www/html/images
COPY ./out/blogpics/ /var/www/html/blogpics
COPY htaccess-blank /var/www/html/.htaccess
COPY robots-block.txt /var/www/html/robots.txt
COPY default-ssl.conf /etc/apache2/sites-enabled/default-ssl.conf
COPY 000-default.conf /etc/apache2/sites-enabled/000-default.conf
COPY apache2.conf /etc/apache2/
EXPOSE 443
CMD apachectl -D FOREGROUND

