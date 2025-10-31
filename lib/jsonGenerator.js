const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const config = require("../config/config.json");
const { blog_folder } = config.settings;
const jsonDir = "./.json";
const baseSiteUrl = (config.site?.base_url || "").replace(/\/$/, "");

const axios = require('axios');
const https =require('https');


const runConfig = require("../public/runConfig.json");
console.log('runConfig is ' + runConfig); // add this line to print runConfig

const agent = new https.Agent({
  rejectUnauthorized: false
});

const toPlainText = (markdown = "") =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]\(([^)]+)\)/g, "$1")
    .replace(/[#>*_~]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text = "", length = 320) =>
  text.length > length ? `${text.slice(0, length).trim()}…` : text;

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
    //console.log('jsonGenerator.getBlogJson result is ' + JSON.stringify(result.data));
  	if (!fs.existsSync('./content/'+blog_folder)) {
    		fs.mkdirSync('./content/'+blog_folder);
		const source = path.join(__dirname, 'content', '_index.md');
		const destination = path.join(__dirname, 'content', blog_folder, '_index.md');
		fs.copyFile(source, destination, (err) => {
    		if (err) {
        		console.error('Error copying file:', err);
    		} else {
        	console.log('File copied successfully!');
    		}
		});
  	}
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

  const postsArray = JSON.parse(data);

  // Loop through the posts object
for (const post of postsArray) {
   if (!post?.slug || !post.frontmatter) {
    console.error('Skipping post with missing slug or frontmatter:', post);
    continue; // skip this iteration
  }
   // Construct the filename from the post's slug
   const filename = `${post.slug}.md`;
   // Construct the frontmatter string from the post's frontmatter object
   const frontmatter = `---\n${Object.keys(post.frontmatter).map((key) => {
     // Handle categories as inline array
     if (key === 'categories' && Array.isArray(post.frontmatter[key])) {
       return `${key}: [${post.frontmatter[key].map((cat) => `"${cat.replace(/"/g, '\\"')}"`).join(', ')}]`;
     }
     // Handle questions and answers as block arrays
     if ((key === 'questions' || key === 'answers') && Array.isArray(post.frontmatter[key])) {
       if (post.frontmatter[key].length === 0) return `${key}: []`;
       return `${key}:\n${post.frontmatter[key].map((item) => `  - "${String(item).replace(/"/g, '\\"')}"`).join('\n')}`;
     }
     // Default
     return `${key}: ${post.frontmatter[key]}`;
   }).join('\n')}\n---\n`;
   // Construct the full content by concatenating the frontmatter and content
   const content = frontmatter + post.content;
   // Write the content to a file
   fs.writeFileSync(path.join(`content/${blog_folder}/`, filename), content);
 }

  const blogIndex = postsArray.map((post) => {
    const frontmatter = post.frontmatter || {};
    const rawContent = post.content || "";
    const plainContent = toPlainText(rawContent);
    const summarySource = frontmatter.description || frontmatter.summary || plainContent;

    return {
      title: frontmatter.title || post.slug,
      slug: post.slug,
      summary: truncate(summarySource, 360),
      content: truncate(plainContent, 4000),
      categories: Array.isArray(frontmatter.categories)
        ? frontmatter.categories
        : [],
      url: baseSiteUrl ? `${baseSiteUrl}/posts/${post.slug}` : `/posts/${post.slug}`,
      image: frontmatter.image || "",
      author: frontmatter.author || config.metadata?.meta_author || "",
      publishedAt: frontmatter.date || null
    };
  });

  try {
    fs.writeFileSync(path.join("public", "blog-index.json"), JSON.stringify(blogIndex, null, 2));
  } catch (err) {
    console.error("Failed to write blog-index.json", err);
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


(async () => {
  try {
    if (!await fs.existsSync(jsonDir)) {
      await fs.mkdirSync(jsonDir);
    }

    const data = await getBlogJson();
    console.log('Got data:', data.length, 'characters');
    await fs.writeFileSync(`${jsonDir}/posts.json`, data);
  } catch (err) {
    console.error(err);
  }
})();
