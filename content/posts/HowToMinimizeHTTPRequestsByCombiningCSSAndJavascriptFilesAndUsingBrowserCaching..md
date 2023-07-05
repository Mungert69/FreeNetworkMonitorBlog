---
title: How To Minimize HTTP Requests By Combining CSS And Javascript Files And Using Browser Caching.
date: 2023-05-22T00:00:03.433619
image: /blogpics/BestPractices/computer-3174729_1920.jpg
categories: ["Website Performance", "Best Practices"]
featured: false
draft: false
---
As websites become more complex and dynamic, they often require numerous HTTP requests to load all the necessary resources like CSS files, JavaScript libraries, images and other assets. Each of these requests adds extra time to the page loading process which can be frustrating for users who want a seamless and fast experience.

One effective way to minimize HTTP requests is by combining multiple CSS and JavaScript files into one single file. This technique enables your website’s server to send only one request instead of several when loading your pages in the browser. It will also help reduce latency as fewer connections are made between client browsers and your web server.

In this article, we’ll show you how to combine CSS & JavaScript files on your website using tools like Gulp or Grunt. We will also discuss best practices when it comes to caching resources in user's browsers using mechanisms such as “browser caching” so that visitors don’t have to wait for assets to download every time they visit a page on your site.

Combining CSS Files
When designing a website, each web page usually needs its own set of stylesheets. A typical webpage may include an external stylesheet for reset.css (the commonly used css reset), another stylesheet for layout.css (defining overall layout structure) and yet another stylesheet representing typography.css (fonts sizes etc.). These separate stylesheets add up quickly leading to unnecessary http-requests.

To combat this problem; combining them into one file would really help speed up our front end performance.
Here’s an example code snippet :

```
<link rel="stylesheet" type="text/css" href="/css/reset.css">
<link rel="stylesheet" type="text/css" href="/css/layout.css">
<link rel=”stylesheet” type=”text/css” href=”/css/typography.css”>
```

We can optimize this further by concatenating all three external css-files into just one:

```
<link rel=”stylesheet” 	type=“text/css” href=”/css/styles.css”>
```

This will reduce the number of HTTP requests required to load the webpage and also increase its speed as there fewer files to download.

Combining JavaScript Files
Similar to CSS, combining Javascript files is equally important for maximizing website performance. You could have separate javascript document for external libraries such as jQuery or other plugins. However just like css-files, this is less efficient.
Rather than including these individual scripts in your HTML code, we can use a build task runner such as Gulp or Grunt with their corresponding concat tools. Combining multiple Javascript into one file helps reduce server requests since users only need download one combined JS asset rather than several.

Here’s an example of how you’d concatenate three seperate JS files:

```
<script src=“js/jquery.js”></script>
<script	src=“js/additionals.js"></script>
<script	src="/path/to/amazing/script-1.js"></script>

``` 
We then combine all three using gulp-concat tool in gulp;

```javascript
gulp.task('scripts', function() {
  return gulp.src(['js/jquery.js', 'js/additionals.js', '/path/to/amazing/script-1.js'])
    .pipe(concat('comibined-scripts.min.js'))
    .pipe(gulp.dest('dist/js'));
});

``` 
Browser caching
Once you have optimized your resources by minimizing HTTP requests through combining CSS and JavaScript files on your site; it's time to add another optimization: browser caching.

Caching involves storing frequently requested data closer to the user (usually stored on end-user devices) for faster accessibility when needed. By enabling browser cache mechanisms during page loading, repeating visits from returning visitors won't require fetching all resources again leading to faster page load times.
Implementing Browser Caching

Every web developer understands that leverage browsers’ caching mechanism can help save bandwidth/server resources while optimally improving loading speeds – particularly important for websites with lots of static content. 

Caching can be enabled using the Expires header, Http Cache-Control headers or through ETags.

Here’s an example code snippet from apache with expires module enabled:

```
<IfModule mod_expires.c>
  <FilesMatch “\.(ico|pdf|flv|jpg|jpeg|png|gif)$”>
    Header set Expires “Thu, 15 Apr 2022 20:00:00 GMT”
    Header set Cache-Control “max-age=31536000”
  </FilesMatch>
</IfModule>

```

In the above code block, Apache reads the expiry date specified in each file and checks whether it has reached its expiry date for every incoming request.
Please note that this will not work on non-Apache servers. If you are on NGINX server refer to their documentation for similar configuration settings.


To enable caching using Http Cache Control Headers; we use the following snippets:

``` 
<Location /images/>
Header set Cache-Control "public"
ExpiresDefault A0
</Location> 
```
The keyword `public` implies that both private and shared caches can store a response whereas `private` indicates it is only applicable to clients accessing contents via authenticated sessions.

Conclusion

Minimizing HTTP requests by combining CSS & JavaScript files helps optimize website performance but at times may pose some challenges especially when dealing with large projects/files.
Using Gulp/Grunt along with tools such as gulp-concat enables web developers effortlessly concatenate all resources into one single file hence boosting site speed/loading times.
Browser cache mechanism brings better experience to returning users since they do not need to download assets again on return visits – saving time and bandwidth while improving user satisfaction.