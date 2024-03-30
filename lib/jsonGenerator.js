const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");
const { blog_folder } = config.settings;
const jsonDir = "./.json";

const axios = require('axios');
const https =require('https');


const runConfig = require("../public/runConfig.json");
console.log('runConfig is ' + runConfig); // add this line to print runConfig

const agent = new https.Agent({
  rejectUnauthorized: false
});

const getBlogJson =  async () => {

  const apiLoadBalancerUrl = runConfig.apiLoadBalancerUrl;

  console.log('apiLoadBalancerUrl is ' + apiLoadBalancerUrl);
  var data ;

 // axiosRetry(axios, { retries: 3 });
    const result =  await axios(
        {
            method: 'post',
            url: apiLoadBalancerUrl + '/Blog/BlogsJson' ,
            data: '',
            httpsAgent: agent,      
        }
    ).catch(function (error) {
        console.log('jsonGenerator.getBlogsJson Axios Error was : ' + error);
        return;
    });
   
  try {
    // console write JSON.stringify(result) to see what it looks like.
    console.log('jsonGenerator.getBlogJson result is ' + JSON.stringify(result.data));
    data = result.data.data;
  }
  catch (error) {
    console.log('jsonGenerator.getBlogJson Mapping Data Error was : ' + error);
    if (result != undefined && result.data.message != undefined)
      console.log('Api Result.Message was ' + result.data.message);
    return '{}';
  }
// Log count of characters of  jsonify of data.
  console.log('ServiceAPI.getBlogJson Got data ' + data.length + ' characters');
  //console.log('ServiceAPI.getBlogJson Got data ' + JSON.stringify(data));
  fs.writeFileSync(`${jsonDir}/posts.json`,  data);

  // Loop through the posts object
for (const post of JSON.parse(data)) {
   // Construct the filename from the post's slug
   const filename = `${post.slug}.md`;
   // Construct the frontmatter string from the post's frontmatter object
   const frontmatter = `---\n${Object.keys(post.frontmatter).map((key) => {
     // Handle categories as an array
     if (key === 'categories') {
       return `${key}: [${post.frontmatter[key].map((cat) => `"${cat.replace(/"/g, '\\"')}"`).join(', ')}]`;
     } else {
       return `${key}: ${post.frontmatter[key]}`;
     }
   }).join('\n')}\n---\n`;
   // Construct the full content by concatenating the frontmatter and content
   const content = frontmatter + post.content;
   // Write the content to a file
   fs.writeFileSync(path.join(`content/${blog_folder}/`, filename), content);
 }
  return data;

}


// get post data
/*const getPosts = fs.readdirSync(path.join(`content/${blog_folder}`));
const filterPosts = getPosts.filter((post) => post.match(/^(?!_)/));
const posts = filterPosts.map((filename) => {
  const slug = filename.replace(".md", "");
  const postData = fs.readFileSync(
    path.join(`content/${blog_folder}/`, filename),
    "utf-8"
  );
  const { data } = matter(postData);
  const content = matter(postData).content;

  return {
    frontmatter: data,
    content: content,
    slug: slug,
  };
});
*/



try {
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir);
  }
  const data=getBlogJson();
  // write data to console
  console.log('Got data ='+data);
  //fs.writeFileSync(`${jsonDir}/posts.json`, JSON.stringify(posts));
  fs.writeFileSync(`${jsonDir}/posts.json`,  data);
} catch (err) {
  console.error(err);
}
